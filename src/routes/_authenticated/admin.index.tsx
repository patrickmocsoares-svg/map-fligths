import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  Loader2,
  MessageCircle,
  Search,
  TrendingUp,
  Ticket,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  getAdminStatsFn,
  listOrdersFn,
  ORDER_STATUSES,
  STATUS_LABELS,
  type AdminOrder,
} from "@/lib/admin.functions";
import { formatBRL } from "@/lib/i18n";
import { whatsappLink } from "@/lib/contact-config";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — MAB Flights" },
      { name: "description", content: "Gestão de solicitações de emissão com milhas." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell>
      <AdminDashboard />
    </AdminShell>
  ),
});

function statusPill(status: string) {
  const map: Record<string, string> = {
    novo: "border-gold/30 bg-gold/10 text-gold",
    em_analise: "border-border bg-muted text-foreground",
    cotacao_enviada: "border-sky-400/30 bg-sky-400/10 text-sky-700",
    aguardando_pagamento: "border-amber-400/30 bg-amber-400/10 text-amber-700",
    pago: "border-emerald-400/30 bg-emerald-400/10 text-emerald-700",
    emitido: "border-emerald-500/40 bg-emerald-500/15 text-emerald-800",
    cancelado: "border-destructive/30 bg-destructive/10 text-destructive",
  };
  return map[status] ?? "border-border bg-muted text-muted-foreground";
}

function AdminDashboard() {
  const fetchStats = useServerFn(getAdminStatsFn);
  const fetchOrders = useServerFn(listOrdersFn);

  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const stats = useQuery({ queryKey: ["admin-stats"], queryFn: () => fetchStats() });

  const orders = useQuery({
    queryKey: ["admin-orders", status, q, origin, destination, from, to, page],
    queryFn: () =>
      fetchOrders({
        data: {
          status: status || undefined,
          q: q || undefined,
          origin: origin || undefined,
          destination: destination || undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          pageSize: 15,
        },
      }),
  });

  const rows: AdminOrder[] = orders.data?.rows ?? [];
  const total = orders.data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / 15));
  const field =
    "w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold/50";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Solicitações de emissão com milhas em tempo real.
      </p>

      {/* KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={<Users className="h-4 w-4" />}
          label="Total de pedidos"
          value={stats.data ? String(stats.data.total) : "—"}
        />
        <Kpi
          icon={<Ticket className="h-4 w-4" />}
          label="Novos"
          value={stats.data ? String(stats.data.byStatus["novo"] ?? 0) : "—"}
        />
        <Kpi
          icon={<Loader2 className="h-4 w-4" />}
          label="Em andamento"
          value={
            stats.data
              ? String(
                  ["em_analise", "cotacao_enviada", "aguardando_pagamento"].reduce(
                    (a, s) => a + (stats.data!.byStatus[s] ?? 0),
                    0,
                  ),
                )
              : "—"
          }
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Receita estimada"
          value={stats.data ? formatBRL(stats.data.revenue) : "—"}
          hint="Pedidos pagos e emitidos"
        />
      </div>

      {/* Status breakdown */}
      <div className="mt-4 flex flex-wrap gap-2">
        {ORDER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(status === s ? "" : s);
              setPage(1);
            }}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
              status === s ? "border-gold bg-gold/15 text-gold" : statusPill(s)
            }`}
          >
            {STATUS_LABELS[s]} · {stats.data?.byStatus[s] ?? 0}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card/40 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${field} pl-9`}
            placeholder="Nome, e-mail ou telefone"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <input
          className={field}
          placeholder="Origem"
          maxLength={3}
          value={origin}
          onChange={(e) => {
            setOrigin(e.target.value.toUpperCase());
            setPage(1);
          }}
        />
        <input
          className={field}
          placeholder="Destino"
          maxLength={3}
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value.toUpperCase());
            setPage(1);
          }}
        />
        <input
          className={field}
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
        <input
          className={field}
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Orders */}
      <div className="mt-6 space-y-3">
        {orders.isLoading ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado com esses filtros.
          </div>
        ) : (
          rows.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-border bg-card/40 p-4 transition hover:border-gold/25 md:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-gold">{o.protocol}</span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusPill(o.status)}`}
                    >
                      {STATUS_LABELS[o.status as keyof typeof STATUS_LABELS] ?? o.status}
                    </span>
                  </div>
                  <div className="mt-1.5 font-display text-lg font-semibold">
                    {o.origin_iata} → {o.destination_iata}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {o.customers?.full_name} · {o.customers?.email} · {o.customers?.phone}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Ida {o.depart_date}
                    {o.return_date ? ` · Volta ${o.return_date}` : " · Somente ida"} ·{" "}
                    {o.adults + o.children + o.infants} pax
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {o.customers?.phone ? (
                    <a
                      href={whatsappLink(
                        `Olá ${o.customers.full_name}! Sobre sua solicitação ${o.protocol} (${o.origin_iata} → ${o.destination_iata}).`,
                        o.customers.phone.replace(/\D/g, "").length >= 12
                          ? o.customers.phone
                          : `55${o.customers.phone.replace(/\D/g, "")}`,
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-medium text-emerald-700"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Falar com cliente
                    </a>
                  ) : null}
                  <Link
                    to="/admin/pedidos/$id"
                    params={{ id: o.id }}
                    className="inline-flex items-center gap-1.5 rounded-xl gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground"
                  >
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pages > 1 ? (
        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-xl border border-border px-4 py-2 text-xs disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-xs text-muted-foreground">
            Página {page} de {pages} · {total} pedidos
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-border px-4 py-2 text-xs disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        <span className="text-gold">{icon}</span> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-extrabold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-[11px] text-muted-foreground/80">{hint}</div> : null}
    </div>
  );
}
