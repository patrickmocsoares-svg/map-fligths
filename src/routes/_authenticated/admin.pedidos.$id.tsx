import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Loader2, Mail, MessageCircle, Save, Sparkles } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  getOrderFn,
  ORDER_STATUSES,
  STATUS_LABELS,
  queueETicketEmailFn,
  updateOrderFn,
} from "@/lib/admin.functions";
import { formatBRL, formatMiles } from "@/lib/i18n";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";
import { quoteMiles } from "@/lib/miles";
import { CABIN_LABELS } from "@/lib/orders/schema";

export const Route = createFileRoute("/_authenticated/admin/pedidos/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe do pedido — MAB Flights" },
      { name: "description", content: "Cotação, status e histórico da solicitação." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell>
      <OrderDetail />
    </AdminShell>
  ),
});

const field =
  "w-full rounded-xl border border-border bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold/50";

function OrderDetail() {
  const { id } = Route.useParams();
  const fetchOrder = useServerFn(getOrderFn);
  const saveOrder = useServerFn(updateOrderFn);
  const sendETicket = useServerFn(queueETicketEmailFn);
  const queryClient = useQueryClient();
  const { settings } = useSettings();

  const q = useQuery({
    queryKey: ["admin-order", id],
    queryFn: () => fetchOrder({ data: { id } }),
  });

  const order = q.data?.order;
  const history = q.data?.history ?? [];

  const [status, setStatus] = useState("novo");
  const [statusNote, setStatusNote] = useState("");
  const [realPrice, setRealPrice] = useState("");
  const [milesRequired, setMilesRequired] = useState("");
  const [milesPrice, setMilesPrice] = useState("");
  const [markup, setMarkup] = useState("");
  const [tax, setTax] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [locator, setLocator] = useState("");

  useEffect(() => {
    if (!order) return;
    setStatus(order.status);
    setRealPrice(order.real_price_brl?.toString() ?? "");
    setMilesRequired(order.miles_required?.toString() ?? "");
    setMilesPrice(order.miles_price_brl?.toString() ?? "");
    setMarkup(order.markup_applied_brl?.toString() ?? "");
    setTax(order.airport_tax_brl?.toString() ?? "");
    setFinalPrice(order.final_price_brl?.toString() ?? "");
    setInternalNotes(order.internal_notes ?? "");
    setLocator(order.locator ?? "");
  }, [order]);

  const mutation = useMutation({
    mutationFn: (payload: unknown) => saveOrder({ data: payload as never }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      setStatusNote("");
    },
  });

  const eticket = useMutation({ mutationFn: () => sendETicket({ data: { id } }) });

  function autoQuote() {
    const price = Number(realPrice);
    if (!price) return;
    const quote = quoteMiles(price, settings);
    setMilesRequired(String(quote.milesRequired));
    setMilesPrice(String(quote.clientPrice));
    setMarkup(String(quote.markup));
    setTax(String(quote.airportTax));
    setFinalPrice(String(quote.clientPrice));
  }

  const num = (v: string) => (v.trim() === "" ? null : Number(v));

  if (q.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }
  if (q.isError || !order) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Pedido não encontrado.</div>;
  }

  const phone = order.customers?.phone ?? "";
  const digits = phone.replace(/\D/g, "");
  const waNumber = digits.length >= 12 ? digits : `55${digits}`;

  return (
    <div>
      <Link
        to="/admin"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar aos pedidos
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="font-mono text-sm font-semibold text-gold">{order.protocol}</div>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight md:text-3xl">
            {order.origin_iata} → {order.destination_iata}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Criado em {new Date(order.created_at).toLocaleString("pt-BR")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {digits ? (
            <a
              href={whatsappLink(
                `Olá ${order.customers?.full_name}! Sobre sua solicitação ${order.protocol}.`,
                waNumber,
              )}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2.5 text-xs font-medium text-emerald-300"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          ) : null}
          <button
            onClick={() => eticket.mutate()}
            disabled={eticket.isPending}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {eticket.isSuccess ? "E-ticket na fila" : "Enviar e-ticket"}
          </button>
        </div>
      </div>
      {eticket.isSuccess ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Registro criado em email_logs. O envio real será ativado quando o provedor de e-mail
          for conectado.
        </p>
      ) : null}

      <div className="mt-7 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        {/* Customer + trip */}
        <div className="space-y-5">
          <Card title="Cliente">
            <Row label="Nome" value={order.customers?.full_name ?? "—"} />
            <Row label="E-mail" value={order.customers?.email ?? "—"} />
            <Row label="Telefone" value={phone || "—"} />
          </Card>

          <Card title="Viagem">
            <Row label="Rota" value={`${order.origin_iata} → ${order.destination_iata}`} />
            <Row label="Ida" value={order.depart_date} />
            <Row label="Volta" value={order.return_date ?? "Somente ida"} />
            <Row
              label="Passageiros"
              value={`${order.adults} adulto(s), ${order.children} criança(s), ${order.infants} bebê(s)`}
            />
            <Row
              label="Classe"
              value={CABIN_LABELS[order.cabin as keyof typeof CABIN_LABELS] ?? order.cabin}
            />
            <Row label="Datas flexíveis" value={order.flexible_dates ? "Sim" : "Não"} />
            <Row label="Cia preferida" value={order.preferred_airline ?? "—"} />
            <Row label="Programa preferido" value={order.preferred_program ?? "—"} />
            <Row
              label="Orçamento do cliente"
              value={order.budget_brl ? formatBRL(Number(order.budget_brl)) : "—"}
            />
            {order.notes ? (
              <div className="mt-3 rounded-xl border border-border bg-background/50 p-3 text-sm text-muted-foreground">
                {order.notes}
              </div>
            ) : null}
          </Card>

          <Card title="Histórico de status">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem movimentações.</p>
            ) : (
              <ol className="space-y-3">
                {history.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    <div>
                      <div className="text-sm">
                        {h.from_status
                          ? `${STATUS_LABELS[h.from_status as keyof typeof STATUS_LABELS] ?? h.from_status} → `
                          : ""}
                        <strong>
                          {STATUS_LABELS[h.to_status as keyof typeof STATUS_LABELS] ?? h.to_status}
                        </strong>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {new Date(h.created_at).toLocaleString("pt-BR")}
                        {h.changed_by ? ` · ${h.changed_by}` : ""}
                      </div>
                      {h.note ? (
                        <div className="mt-1 text-xs text-muted-foreground">{h.note}</div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        {/* Quote panel */}
        <div className="space-y-5">
          <Card title="Cotação em milhas">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Preço real (R$)">
                <input
                  className={field}
                  type="number"
                  step="0.01"
                  value={realPrice}
                  onChange={(e) => setRealPrice(e.target.value)}
                />
              </Field>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={autoQuote}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-xs font-semibold text-gold"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Calcular automaticamente
                </button>
              </div>
              <Field label="Milhas necessárias">
                <input
                  className={field}
                  type="number"
                  value={milesRequired}
                  onChange={(e) => setMilesRequired(e.target.value)}
                />
              </Field>
              <Field label="Preço em milhas (R$)">
                <input
                  className={field}
                  type="number"
                  step="0.01"
                  value={milesPrice}
                  onChange={(e) => setMilesPrice(e.target.value)}
                />
              </Field>
              <Field label="Markup (R$)">
                <input
                  className={field}
                  type="number"
                  step="0.01"
                  value={markup}
                  onChange={(e) => setMarkup(e.target.value)}
                />
              </Field>
              <Field label="Taxa de embarque (R$)">
                <input
                  className={field}
                  type="number"
                  step="0.01"
                  value={tax}
                  onChange={(e) => setTax(e.target.value)}
                />
              </Field>
              <Field label="Valor final ao cliente (R$)">
                <input
                  className={field}
                  type="number"
                  step="0.01"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                />
              </Field>
              <Field label="Localizador">
                <input
                  className={field}
                  value={locator}
                  onChange={(e) => setLocator(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                />
              </Field>
            </div>

            {realPrice && finalPrice ? (
              <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 p-3 text-sm">
                Economia estimada do cliente:{" "}
                <strong className="text-gold">
                  {formatBRL(Math.max(0, Number(realPrice) - Number(finalPrice)))}
                </strong>{" "}
                {Number(realPrice) > 0
                  ? `(${(((Number(realPrice) - Number(finalPrice)) / Number(realPrice)) * 100).toFixed(1)}%)`
                  : null}
                {milesRequired ? ` · ${formatMiles(Number(milesRequired))} milhas` : ""}
              </div>
            ) : null}
          </Card>

          <Card title="Status e observações">
            <Field label="Status atual">
              <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s} className="bg-background">
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </Field>
            <div className="mt-3">
              <Field label="Nota da mudança de status">
                <input
                  className={field}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Opcional"
                />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Observações internas">
                <textarea
                  rows={4}
                  className={`${field} resize-y`}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </Field>
            </div>

            <button
              onClick={() =>
                mutation.mutate({
                  id,
                  status,
                  statusNote: statusNote || undefined,
                  realPriceBRL: num(realPrice),
                  milesRequired: num(milesRequired),
                  milesPriceBRL: num(milesPrice),
                  markupBRL: num(markup),
                  airportTaxBRL: num(tax),
                  finalPriceBRL: num(finalPrice),
                  internalNotes: internalNotes || null,
                  locator: locator || null,
                })
              }
              disabled={mutation.isPending}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe disabled:opacity-60"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar pedido
            </button>
            {mutation.isSuccess ? (
              <p className="mt-2 text-center text-xs text-emerald-300">Alterações salvas.</p>
            ) : null}
            {mutation.isError ? (
              <p className="mt-2 text-center text-xs text-destructive">
                {(mutation.error as Error).message}
              </p>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/40 p-5">
      <h2 className="mb-4 text-[10px] uppercase tracking-[0.24em] text-gold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
