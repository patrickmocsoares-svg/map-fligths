/**
 * Server-only e-mail notification for new quote requests (Resend).
 *
 * CLIENTE -> formulário TRIPmoc -> backend -> Resend -> e-mail do administrador.
 *
 * Environment variables (never exposed to the browser):
 *  - RESEND_API_KEY            (obrigatória)
 *  - ADMIN_NOTIFICATION_EMAIL  (destinatário; fallback abaixo)
 *  - RESEND_FROM               (opcional; padrão onboarding@resend.dev)
 */

export type OrderEmailPayload = {
  id: string;
  protocol: string;
  fullName: string;
  phone: string;
  email: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers: string;
  cabin?: string;
  preferredAirline?: string;
  preferredProgram?: string;
  budgetBRL?: number;
  notes?: string;
  createdAt: string;
};

const FALLBACK_ADMIN_EMAIL = "patrickmoc@hotmail.com";
const FALLBACK_FROM = "TRIPmoc <onboarding@resend.dev>";

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function buildOrderEmailText(n: OrderEmailPayload) {
  const extras: string[] = [];
  if (n.cabin) extras.push(`Classe: ${n.cabin}`);
  if (n.preferredAirline) extras.push(`Companhia preferida: ${n.preferredAirline}`);
  if (n.preferredProgram) extras.push(`Programa preferido: ${n.preferredProgram}`);
  if (typeof n.budgetBRL === "number" && Number.isFinite(n.budgetBRL)) {
    extras.push(`Orçamento informado: R$ ${n.budgetBRL.toFixed(2)}`);
  }

  return [
    "NOVA SOLICITAÇÃO DE ORÇAMENTO — TRIPmoc",
    "",
    `Protocolo: ${n.protocol}`,
    `Data/hora: ${formatDateTime(n.createdAt)}`,
    "",
    "CLIENTE",
    `Nome: ${n.fullName}`,
    `WhatsApp: ${n.phone}`,
    `E-mail: ${n.email}`,
    "",
    "VIAGEM",
    `Origem: ${n.origin}`,
    `Destino: ${n.destination}`,
    `Ida: ${n.departDate}`,
    `Volta: ${n.returnDate ?? "Somente ida"}`,
    `Passageiros: ${n.passengers}`,
    ...(extras.length ? ["", "DETALHES", ...extras] : []),
    "",
    "OBSERVAÇÕES",
    n.notes && n.notes.trim().length > 0 ? n.notes.trim() : "—",
    "",
    `ID interno: ${n.id}`,
  ].join("\n");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Sends the admin notification. Never throws — returns the outcome. */
export async function notifyAdminByEmail(n: OrderEmailPayload): Promise<{
  sent: boolean;
  to: string;
  error?: string;
}> {
  const to = (process.env["ADMIN_NOTIFICATION_EMAIL"] || FALLBACK_ADMIN_EMAIL).trim();
  const from = (process.env["RESEND_FROM"] || FALLBACK_FROM).trim();
  const apiKey = (process.env["RESEND_API_KEY"] || "").trim();

  if (!apiKey) {
    return { sent: false, to, error: "RESEND_API_KEY não configurada no backend" };
  }

  const text = buildOrderEmailText(n);
  const html = `<pre style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(
    text,
  )}</pre>`;

  const send = async (recipient: string) => {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: n.email,
        subject: `✈️ Nova solicitação de orçamento — TRIPmoc #${n.protocol}`,
        text,
        html,
      }),
    });
    const body = res.ok ? "" : await res.text();
    return { ok: res.ok, status: res.status, body };
  };

  try {
    const first = await send(to);
    if (first.ok) return { sent: true, to };

    // Resend em modo de teste (domínio ainda não verificado) só entrega para o
    // e-mail dono da conta. Reenvia para lá para o pedido não se perder.
    const accountEmail = (process.env["RESEND_ACCOUNT_EMAIL"] || "").trim();
    const restricted =
      first.status === 403 && first.body.includes("your own email address");
    if (restricted && accountEmail && accountEmail.toLowerCase() !== to.toLowerCase()) {
      const retry = await send(accountEmail);
      if (retry.ok) return { sent: true, to: accountEmail };
      return {
        sent: false,
        to: accountEmail,
        error: `${retry.status} ${retry.body.slice(0, 300)}`,
      };
    }

    return { sent: false, to, error: `${first.status} ${first.body.slice(0, 300)}` };
  } catch (err) {
    return { sent: false, to, error: err instanceof Error ? err.message : "erro desconhecido" };
  }
}
