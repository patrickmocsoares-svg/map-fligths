import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, RefreshCw, Lock } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { runDiagnosticsFn, type CheckStatus } from "@/lib/diagnostics.functions";

export const Route = createFileRoute("/_authenticated/admin/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico do sistema — TRIPmoc" },
      { name: "description", content: "Verificação de banco, preços, e-mails e atualização automática." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell>
      <DiagnosticsPage />
    </AdminShell>
  ),
});

const ICON: Record<CheckStatus, { Icon: typeof CheckCircle2; cls: string; label: string }> = {
  ok: { Icon: CheckCircle2, cls: "text-brand", label: "OK" },
  warn: { Icon: AlertTriangle, cls: "text-cta", label: "Atenção" },
  error: { Icon: XCircle, cls: "text-destructive", label: "Erro" },
};

function DiagnosticsPage() {
  const run = useServerFn(runDiagnosticsFn);
  const q = useQuery({ queryKey: ["admin-diagnostics"], queryFn: () => run(), retry: false });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Diagnóstico do sistema</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mostra apenas se cada configuração existe — nenhum valor secreto é exibido.
          </p>
        </div>
        <button
          onClick={() => q.refetch()}
          disabled={q.isFetching}
          className="inline-flex items-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-bold text-primary-foreground disabled:opacity-60"
        >
          {q.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Verificar novamente
        </button>
      </div>

      {q.isLoading && (
        <div className="mt-10 grid place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
        </div>
      )}
      {q.isError && (
        <p className="mt-6 rounded-xl border border-border p-4 text-sm text-destructive">
          Não foi possível executar o diagnóstico: {(q.error as Error).message}
        </p>
      )}

      {q.data && (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {q.data.sections.map((s) => {
              const { Icon, cls, label } = ICON[s.status];
              return (
                <section key={s.id} className="rounded-2xl border border-border bg-card/50 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-display text-lg font-semibold">{s.title}</h2>
                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${cls}`}>
                      <Icon className="h-4 w-4" /> {label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{s.message}</p>
                  {s.latencyMs !== undefined && (
                    <p className="mt-1 text-xs text-muted-foreground">Tempo de resposta: {s.latencyMs} ms</p>
                  )}
                  <ul className="mt-4 space-y-1.5">
                    {s.vars.map((v) => (
                      <li key={v.name} className="flex items-center justify-between gap-2 text-xs">
                        <span className="flex items-center gap-1.5 font-mono">
                          {v.secret && <Lock className="h-3 w-3 text-muted-foreground" />}
                          {v.name}
                          {!v.required && <span className="font-sans text-muted-foreground">(opcional)</span>}
                        </span>
                        <span
                          className={
                            v.present
                              ? "text-brand"
                              : v.required
                                ? "font-semibold text-destructive"
                                : "text-muted-foreground"
                          }
                        >
                          {v.present ? "Configurada" : "Ausente"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Verificado em {new Date(q.data.checkedAt).toLocaleString("pt-BR")}
          </p>
        </>
      )}
    </div>
  );
}
