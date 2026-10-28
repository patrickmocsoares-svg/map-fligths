import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import type { CheckStatus, DiagHistoryRun } from "@/lib/diagnostics.functions";

const STATUS: Record<CheckStatus, { Icon: typeof CheckCircle2; cls: string; label: string }> = {
  ok: { Icon: CheckCircle2, cls: "text-brand", label: "OK" },
  warn: { Icon: AlertTriangle, cls: "text-cta", label: "Atenção" },
  error: { Icon: XCircle, cls: "text-destructive", label: "Erro" },
};

const fmt = (iso: string) => new Date(iso).toLocaleString("pt-BR");

function StatusIcon({ status }: { status: CheckStatus }) {
  const { Icon, cls, label } = STATUS[status] ?? STATUS.warn;
  return <Icon className={`h-4 w-4 ${cls}`} aria-label={label} />;
}

export function DiagnosticsHistory({ runs }: { runs: DiagHistoryRun[] }) {
  const [selected, setSelected] = useState<string[]>([]);

  const services = useMemo(() => {
    const map = new Map<string, { title: string; total: number; errors: number; warns: number; lastFail?: string; lastMsg?: string; streak: number }>();
    // runs are newest-first
    for (const run of runs) {
      for (const s of run.sections) {
        const e = map.get(s.id) ?? { title: s.title, total: 0, errors: 0, warns: 0, streak: 0 };
        e.total++;
        if (s.status === "error") e.errors++;
        if (s.status === "warn") e.warns++;
        if (s.status !== "ok" && !e.lastFail) {
          e.lastFail = run.checkedAt;
          e.lastMsg = s.message;
        }
        map.set(s.id, e);
      }
    }
    for (const [id, e] of map) {
      let streak = 0;
      for (const run of runs) {
        const s = run.sections.find((x) => x.id === id);
        if (!s || s.status === "ok") break;
        streak++;
      }
      e.streak = streak;
    }
    return [...map.entries()];
  }, [runs]);

  const toggle = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-2)));

  const compare = selected
    .map((id) => runs.find((r) => r.id === id))
    .filter((r): r is DiagHistoryRun => Boolean(r))
    .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));

  if (runs.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="font-display text-xl font-bold">Histórico</h2>
        <p className="mt-2 text-sm text-muted-foreground">Nenhuma verificação registrada ainda.</p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold">Histórico</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Últimas {runs.length} verificações. Selecione duas para comparar.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {services.map(([id, s]) => {
          const failRate = Math.round(((s.errors + s.warns) / Math.max(1, s.total)) * 100);
          const recurring = s.streak >= 2 || failRate >= 30;
          return (
            <div key={id} className={`rounded-xl border p-4 ${recurring ? "border-destructive/60" : "border-border"} bg-card/50`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{s.title}</h3>
                {recurring && <span className="text-xs font-semibold text-destructive">Falha recorrente</span>}
              </div>
              <p className="mt-2 text-2xl font-bold">{failRate}%</p>
              <p className="text-xs text-muted-foreground">
                das verificações com problema ({s.errors} erro(s), {s.warns} atenção)
              </p>
              {s.streak > 0 && (
                <p className="mt-1 text-xs text-destructive">Falhando nas últimas {s.streak} verificação(ões)</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {s.lastFail ? `Última falha: ${fmt(s.lastFail)}` : "Sem falhas registradas"}
              </p>
              {s.lastMsg && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.lastMsg}</p>}
            </div>
          );
        })}
      </div>

      {compare.length === 2 && (
        <div className="overflow-x-auto rounded-xl border border-border bg-card/50">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="p-3">Serviço</th>
                <th className="p-3">{fmt(compare[0].checkedAt)}</th>
                <th className="p-3">{fmt(compare[1].checkedAt)}</th>
                <th className="p-3">Mudança</th>
              </tr>
            </thead>
            <tbody>
              {services.map(([id, svc]) => {
                const a = compare[0].sections.find((x) => x.id === id);
                const b = compare[1].sections.find((x) => x.id === id);
                const changed = a?.status !== b?.status;
                return (
                  <tr key={id} className="border-b border-border/50 align-top">
                    <td className="p-3 font-medium">{svc.title}</td>
                    {[a, b].map((s, i) => (
                      <td key={i} className="p-3">
                        {s ? (
                          <div className="flex gap-2">
                            <StatusIcon status={s.status} />
                            <div>
                              <p className="text-xs">{s.message}</p>
                              {s.latencyMs != null && <p className="text-xs text-muted-foreground">{s.latencyMs} ms</p>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    ))}
                    <td className={`p-3 text-xs font-semibold ${changed ? "text-cta" : "text-muted-foreground"}`}>
                      {changed ? "Mudou" : "Igual"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-card/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="p-3">Comparar</th>
              <th className="p-3">Data</th>
              <th className="p-3">Geral</th>
              {services.map(([id, s]) => (
                <th key={id} className="p-3">{s.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-b border-border/50">
                <td className="p-3">
                  <input
                    type="checkbox"
                    aria-label={`Comparar verificação de ${fmt(r.checkedAt)}`}
                    checked={selected.includes(r.id)}
                    onChange={() => toggle(r.id)}
                  />
                </td>
                <td className="p-3 whitespace-nowrap text-xs">{fmt(r.checkedAt)}</td>
                <td className="p-3"><StatusIcon status={r.overall} /></td>
                {services.map(([id]) => {
                  const s = r.sections.find((x) => x.id === id);
                  return (
                    <td key={id} className="p-3" title={s?.message}>
                      {s ? <StatusIcon status={s.status} /> : <span className="text-muted-foreground">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
