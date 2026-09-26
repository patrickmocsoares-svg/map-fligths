/**
 * Admin-only system diagnostics. Reports presence (never values) of
 * configuration and performs lightweight live checks.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type CheckStatus = "ok" | "warn" | "error";
export type DiagVar = { name: string; secret: boolean; required: boolean; present: boolean };
export type DiagSection = {
  id: string;
  title: string;
  status: CheckStatus;
  message: string;
  vars: DiagVar[];
  latencyMs?: number;
};

function has(name: string) {
  return Boolean((process.env[name] || "").trim());
}
function v(name: string, secret: boolean, required: boolean): DiagVar {
  return { name, secret, required, present: has(name) };
}
async function timed<T>(fn: () => Promise<T>) {
  const t = Date.now();
  const r = await fn();
  return { r, ms: Date.now() - t };
}

export const runDiagnosticsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const sections: DiagSection[] = [];

    // 1. Database
    {
      const vars = [
        v("SUPABASE_URL", false, true),
        v("SUPABASE_PUBLISHABLE_KEY", false, true),
        v("SUPABASE_SERVICE_ROLE_KEY", true, true),
      ];
      let status: CheckStatus = "ok";
      let message = "Conexão com o banco funcionando.";
      let latencyMs: number | undefined;
      if (vars.some((x) => !x.present)) {
        status = "error";
        message = "Configuração do banco incompleta.";
      } else {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { r, ms } = await timed(async () =>
            supabaseAdmin.from("settings").select("key", { count: "exact", head: true }),
          );
          latencyMs = ms;
          if (r.error) {
            status = "error";
            message = `Banco respondeu com erro: ${r.error.message.slice(0, 160)}`;
          }
        } catch (e) {
          status = "error";
          message = `Falha ao conectar: ${(e as Error).message.slice(0, 160)}`;
        }
      }
      sections.push({ id: "db", title: "Banco de dados", status, message, vars, latencyMs });
    }

    // 2. Price provider
    {
      const vars = [v("TRAVELPAYOUTS_TOKEN", true, true), v("RAPIDAPI_KEY", true, false)];
      let status: CheckStatus = "ok";
      let message = "Provedor de preços respondendo.";
      let latencyMs: number | undefined;
      if (!vars[0].present) {
        status = "error";
        message = "Token do provedor de preços ausente — ofertas ficam sem preço.";
      } else {
        try {
          const url =
            "https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=SAO&destination=RIO&currency=brl&limit=1&one_way=true";
          const { r, ms } = await timed(() =>
            fetch(url, {
              headers: { "X-Access-Token": process.env["TRAVELPAYOUTS_TOKEN"]!.trim() },
              signal: AbortSignal.timeout(8000),
            }),
          );
          latencyMs = ms;
          if (r.status === 401 || r.status === 403) {
            status = "error";
            message = "Token do provedor de preços foi recusado (inválido ou expirado).";
          } else if (!r.ok) {
            status = "warn";
            message = `Provedor de preços respondeu HTTP ${r.status}.`;
          } else {
            const j = (await r.json().catch(() => null)) as { data?: unknown[] } | null;
            if (!j?.data?.length) {
              status = "warn";
              message = "Provedor respondeu, mas sem preços para a rota de teste.";
            }
          }
        } catch (e) {
          status = "error";
          message = `Sem resposta do provedor: ${(e as Error).message.slice(0, 120)}`;
        }
        if (status === "ok" && !vars[1].present) {
          message += " (Busca Skyscanner opcional desativada.)";
        }
      }
      sections.push({ id: "prices", title: "Provedor de preços", status, message, vars, latencyMs });
    }

    // 3. Email
    {
      const vars = [
        v("RESEND_API_KEY", true, true),
        v("ADMIN_NOTIFICATION_EMAIL", false, false),
        v("RESEND_ACCOUNT_EMAIL", false, false),
        v("RESEND_FROM", false, false),
      ];
      let status: CheckStatus = "ok";
      let message = "Serviço de e-mail aceitou a chave.";
      let latencyMs: number | undefined;
      if (!vars[0].present) {
        status = "error";
        message = "Chave do serviço de e-mail ausente — notificações não são enviadas.";
      } else {
        try {
          const { r, ms } = await timed(() =>
            fetch("https://api.resend.com/domains", {
              headers: { Authorization: `Bearer ${process.env["RESEND_API_KEY"]!.trim()}` },
              signal: AbortSignal.timeout(8000),
            }),
          );
          latencyMs = ms;
          if (r.status === 401) {
            const body = (await r.json().catch(() => null)) as { name?: string } | null;
            if (body?.name === "restricted_api_key") {
              message = "Chave válida (permissão só de envio).";
            } else {
              status = "error";
              message = "Chave do serviço de e-mail foi recusada.";
            }
          } else if (r.ok) {
            const j = (await r.json().catch(() => null)) as {
              data?: { status?: string }[];
            } | null;
            const verified = (j?.data ?? []).some((d) => d.status === "verified");
            if (!verified) {
              status = "warn";
              message =
                "Chave válida, mas sem domínio verificado: e-mails só chegam ao dono da conta.";
            }
          } else {
            status = "warn";
            message = `Serviço de e-mail respondeu HTTP ${r.status}.`;
          }
        } catch (e) {
          status = "error";
          message = `Sem resposta do serviço de e-mail: ${(e as Error).message.slice(0, 120)}`;
        }
      }
      // last send result
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("email_logs")
          .select("status, created_at")
          .order("created_at", { ascending: false })
          .limit(1);
        const last = data?.[0];
        if (last) {
          message += ` Último envio: ${last.status} em ${new Date(last.created_at as string).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`;
          if (last.status === "failed" && status === "ok") status = "warn";
        }
      } catch {
        /* ignore */
      }
      sections.push({ id: "email", title: "Envio de e-mails", status, message, vars, latencyMs });
    }

    // 4. Automatic update
    {
      const vars = [v("DISCOVERY_HOOK_SECRET", true, true)];
      let status: CheckStatus = "ok";
      let message = "";
      if (!vars[0].present) {
        status = "error";
        message = "Segredo da atualização automática ausente — o agendamento é recusado.";
      }
      try {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await supabaseAdmin
          .from("price_history")
          .select("searched_at")
          .order("searched_at", { ascending: false })
          .limit(1);
        const last = data?.[0]?.searched_at as string | undefined;
        if (!last) {
          if (status === "ok") status = "warn";
          message += " Nenhuma coleta de preços registrada ainda.";
        } else {
          const hours = (Date.now() - new Date(last).getTime()) / 36e5;
          const when = new Date(last).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
          if (hours > 48 && status === "ok") status = "warn";
          message += ` Última coleta: ${when} (há ${hours < 1 ? "menos de 1" : Math.round(hours)} h).`;
        }
      } catch {
        /* ignore */
      }
      if (status === "ok") message = "Atualização automática ativa." + message;
      sections.push({
        id: "cron",
        title: "Atualização automática",
        status,
        message: message.trim(),
        vars,
      });
    }

    return { checkedAt: new Date().toISOString(), sections };
  });
