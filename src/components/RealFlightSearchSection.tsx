import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plane,
  Clock,
  ArrowRight,
  ArrowLeftRight,
  Loader2,
  MessageCircle,
  CalendarDays,
} from "lucide-react";
import { searchFlightsFn } from "@/lib/flights.functions";
import { getNearbyDatesFn } from "@/lib/deals/travelpayouts-deals.functions";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";
import type { FlightOffer, CabinClass } from "@/lib/flights/types";

type TripType = "roundtrip" | "oneway";
type SortKey = "price" | "duration" | "stops";

type NearbyDate = { date: string; price: number; currency: string };

function fmtTime(v: string | null | undefined) {
  if (!v) return "--:--";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(min: number | null | undefined) {
  if (!min) return "—";
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, "0")}m`;
}

function fmtPrice(v: number | null | undefined, currency = "BRL") {
  if (v == null) return "Sob consulta";
  return v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
}

function fmtDate(v: string) {
  const d = new Date(`${v}T12:00:00`);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

const CABINS: { value: CabinClass; label: string }[] = [
  { value: "economy", label: "Econômica" },
  { value: "premium", label: "Premium" },
  { value: "business", label: "Executiva" },
  { value: "first", label: "Primeira classe" },
];

export function RealFlightSearchSection() {
  const { settings } = useSettings();
  const search = useServerFn(searchFlightsFn);
  const nearby = useServerFn(getNearbyDatesFn);

  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [cabin, setCabin] = useState<CabinClass>("economy");
  const [sort, setSort] = useState<SortKey>("price");
  const [suggestions, setSuggestions] = useState<NearbyDate[]>([]);

  const mutation = useMutation({
    mutationFn: async (vars: {
      origin: string;
      destination: string;
      departDate: string;
      returnDate?: string;
      passengers: number;
      cabin: CabinClass;
    }) => {
      const res = await search({ data: { ...vars, currency: "BRL", limit: 30 } });
      const offers = (res?.offers ?? []) as FlightOffer[];
      if (offers.length === 0) {
        const alt = (await nearby({
          data: { origin: vars.origin, destination: vars.destination, around: vars.departDate },
        })) as NearbyDate[];
        setSuggestions(alt ?? []);
      } else {
        setSuggestions([]);
      }
      return offers;
    },
  });

  function runSearch(overrideDate?: string) {
    if (origin.trim().length !== 3 || destination.trim().length !== 3) return;
    const depart = overrideDate ?? date;
    if (!depart) return;
    if (overrideDate) setDate(overrideDate);
    mutation.mutate({
      origin: origin.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      departDate: depart,
      returnDate: tripType === "roundtrip" && returnDate ? returnDate : undefined,
      passengers,
      cabin,
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    runSearch();
  }

  function swap() {
    setOrigin(destination);
    setDestination(origin);
  }

  const offers = [...(mutation.data ?? [])].sort((a, b) => {
    if (sort === "price") return a.price - b.price;
    if (sort === "duration") return a.durationMin - b.durationMin;
    return a.stops - b.stops;
  });

  const field =
    "w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-sky-950 outline-none transition-colors placeholder:text-sky-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200";
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-sky-700";

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <h2 className="font-display text-3xl font-bold tracking-tight text-sky-950 md:text-4xl">
          Buscar Passagens Aéreas
        </h2>
        <p className="mt-2 text-sm text-sky-700">
          Tarifas reais consultadas em tempo real. Finalize com nosso time pelo WhatsApp.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 rounded-3xl border border-sky-100 bg-sky-50/70 p-5 shadow-sm md:p-6"
        >
          <div className="mb-4 inline-flex rounded-xl border border-sky-200 bg-white p-1">
            {(
              [
                ["roundtrip", "Ida e volta"],
                ["oneway", "Somente ida"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTripType(value)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                  tripType === value ? "bg-sky-600 text-white" : "text-sky-700 hover:bg-sky-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-12">
            <div className="md:col-span-3">
              <label className={labelCls}>Origem</label>
              <input
                className={field}
                placeholder="Ex: GRU"
                maxLength={3}
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="flex items-end md:col-span-1">
              <button
                type="button"
                onClick={swap}
                aria-label="Inverter origem e destino"
                className="mb-1 inline-flex h-11 w-full items-center justify-center rounded-xl border border-sky-200 bg-white text-sky-700 transition-colors hover:bg-sky-100"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </button>
            </div>

            <div className="md:col-span-3">
              <label className={labelCls}>Destino</label>
              <input
                className={field}
                placeholder="Ex: MIA"
                maxLength={3}
                value={destination}
                onChange={(e) => setDestination(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Data de ida</label>
              <input
                type="date"
                className={field}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className={labelCls}>Data de volta</label>
              <input
                type="date"
                className={field}
                value={returnDate}
                disabled={tripType === "oneway"}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-3">
              <label className={labelCls}>Passageiros</label>
              <select
                className={field}
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
              >
                {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "passageiro" : "passageiros"}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className={labelCls}>Classe</label>
              <select
                className={field}
                value={cabin}
                onChange={(e) => setCabin(e.target.value as CabinClass)}
              >
                {CABINS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className={labelCls}>Ordenar por</label>
              <select
                className={field}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
              >
                <option value="price">Menor preço</option>
                <option value="duration">Menor duração</option>
                <option value="stops">Menos conexões</option>
              </select>
            </div>

            <div className="flex items-end md:col-span-3">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
              >
                {mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plane className="h-4 w-4" />
                )}
                Buscar Voos
              </button>
            </div>
          </div>
        </form>

        {mutation.isPending && (
          <p className="mt-8 text-sm text-sky-700">Consultando as melhores tarifas…</p>
        )}

        {mutation.isError && (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            Não foi possível concluir a busca agora. Tente novamente em instantes.
          </p>
        )}

        {mutation.isSuccess && offers.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-sky-200 bg-sky-50 p-6">
            <p className="text-sm text-sky-800">
              Não encontramos tarifas publicadas para essa data. Veja datas próximas com preço
              disponível ou fale com a gente.
            </p>
            {suggestions.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s.date}
                    type="button"
                    onClick={() => runSearch(s.date)}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100"
                  >
                    <CalendarDays className="h-3.5 w-3.5" />
                    {fmtDate(s.date)} · {fmtPrice(s.price, s.currency)}
                  </button>
                ))}
              </div>
            )}
            <a
              href={whatsappLink(
                `Olá! Procuro passagem ${origin} → ${destination} em ${date}${
                  tripType === "roundtrip" && returnDate ? ` (volta ${returnDate})` : ""
                } para ${passengers} passageiro(s).`,
                settings.whatsappNumber,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </div>
        )}

        {offers.length > 0 && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {offers.map((r) => {
              const msg = `Olá! Quero comprar a passagem ${origin} → ${destination} em ${date}${
                tripType === "roundtrip" && returnDate ? ` (volta ${returnDate})` : ""
              } pela ${r.airline.name} por ${fmtPrice(r.price, r.currency)} (${passengers} passageiro(s)).`;
              return (
                <article
                  key={r.id}
                  className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-sky-950">{r.airline.name}</div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-sky-700">
                        <span className="font-medium">{fmtTime(r.departureTime)}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span className="font-medium">{fmtTime(r.arrivalTime)}</span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-sky-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> {fmtDuration(r.durationMin)}
                        </span>
                        <span>{r.stops === 0 ? "Direto" : `${r.stops} conexão(ões)`}</span>
                      </div>
                    </div>
                    <div className="text-right text-2xl font-bold text-sky-700">
                      {fmtPrice(r.price, r.currency)}
                    </div>
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
