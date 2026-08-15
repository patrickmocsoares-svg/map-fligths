import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plane, Clock, ArrowRight, Loader2, MessageCircle } from "lucide-react";
import { searchSkyscannerFn, type SkyResult } from "@/lib/skyscanner.functions";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";

function fmtTime(v: string | null) {
  if (!v) return "--:--";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(min: number | null) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

function fmtPrice(v: number | null) {
  if (v == null) return "Sob consulta";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function SkyscannerSearchSection() {
  const { settings } = useSettings();
  const search = useServerFn(searchSkyscannerFn);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const mutation = useMutation({
    mutationFn: (vars: { origin: string; destination: string; date: string; returnDate: string }) =>
      search({ data: vars }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (origin.trim().length !== 3 || destination.trim().length !== 3 || !date) return;
    mutation.mutate({
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      date,
      returnDate,
    });
  }

  const results: SkyResult[] = mutation.data?.results ?? [];

  const field =
    "w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-950 outline-none transition-colors placeholder:text-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200";

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight text-sky-950 md:text-4xl">
          Buscar Passagens Aéreas
        </h2>
        <p className="mt-2 text-sm text-sky-700">
          Consulte tarifas em tempo real e finalize com nosso time pelo WhatsApp.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 grid gap-4 rounded-3xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm md:grid-cols-5 md:p-6"
        >
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sky-700">Origem</label>
            <input
              className={field}
              placeholder="Ex: GRU"
              maxLength={3}
              value={origin}
              onChange={(e) => setOrigin(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sky-700">Destino</label>
            <input
              className={field}
              placeholder="Ex: MIA"
              maxLength={3}
              value={destination}
              onChange={(e) => setDestination(e.target.value.toUpperCase())}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sky-700">Data de ida</label>
            <input type="date" className={field} value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sky-700">Data de volta</label>
            <input type="date" className={field} value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
            >
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plane className="h-4 w-4" />}
              Buscar Voos
            </button>
          </div>
        </form>

        {mutation.isPending && (
          <p className="mt-8 text-sm text-sky-700">Consultando as melhores tarifas…</p>
        )}

        {mutation.isSuccess && results.length === 0 && (
          <p className="mt-8 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-6 text-sm text-sky-700">
            Nenhum voo encontrado para esse trecho. Tente outras datas ou fale com a gente no WhatsApp.
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {results.map((r) => {
              const msg = `Olá! Quero comprar a passagem ${origin} → ${destination} em ${date}${
                returnDate ? ` (volta ${returnDate})` : ""
              } pela ${r.airline} por ${fmtPrice(r.price)}.`;
              return (
                <article
                  key={r.id}
                  className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-sky-950">{r.airline}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-sky-700">
                        <span className="font-medium">{fmtTime(r.departureTime)}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span className="font-medium">{fmtTime(r.arrivalTime)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-sky-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {fmtDuration(r.durationMin)}
                        </span>
                        <span>
                          {r.stops === 0 ? "Direto" : r.stops == null ? "Conexões a confirmar" : `${r.stops} conexão(ões)`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-2xl font-bold text-sky-700">{fmtPrice(r.price)}</div>
                  </div>

                  <a
                    href={whatsappLink(msg, settings.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="h-4 w-4" /> Comprar via WhatsApp
                  </a>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
