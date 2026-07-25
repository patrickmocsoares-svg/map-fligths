import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Briefcase,
  Check,
  Clock,
  Heart,
  Plane,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { searchFlightsFn } from "@/lib/flights.functions";
import { getRouteStatsFn } from "@/lib/deals.functions";
import type {
  FlightItinerary,
  FlightOffer,
  FlightSearchParams,
} from "@/lib/flights/types";
import { useAirport } from "@/lib/airports";
import { destinationImage } from "@/lib/destination-images";
import { formatBRL, formatMiles, t } from "@/lib/i18n";
import {
  computeMabScoreFromStats,
  scoreColorClass,
  scoreLabelKey,
  trendLabelKey,
  type MabScore,
} from "@/lib/mab-score";
import {
  KEYS,
  useLocalStorage,
  type PriceAlert,
  type SavedRoute,
} from "@/lib/storage";
import { buildAffiliateUrl } from "@/lib/affiliate";

const cabinEnum = z.enum(["economy", "premium", "business", "first"]);

const searchSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  depart: z.string().optional(),
  ret: z.string().optional(),
  pax: z.number().optional(),
  cabin: cabinEnum.optional(),
});

export const Route = createFileRoute("/flight/$id")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Detalhes da oferta — MAB Flights" },
      {
        name: "description",
        content: "Revise a oferta selecionada e continue para compra.",
      },
      { property: "og:title", content: "Detalhes da oferta — MAB Flights" },
      {
        property: "og:description",
        content: "Detalhes de voo, MAB Score e economia estimada.",
      },
    ],
  }),
  component: FlightDetail,
});

function FlightDetail() {
  const { id } = Route.useParams();
  const params = Route.useSearch();
  const navigate = useNavigate();
  const search = useServerFn(searchFlightsFn);
  const routeStats = useServerFn(getRouteStatsFn);

  const ready = !!(params.origin && params.destination && params.depart);

  const offersQuery = useQuery({
    queryKey: [
      "flights",
      params.origin,
      params.destination,
      params.depart,
      params.ret,
      params.pax,
      params.cabin,
    ],
    enabled: ready,
    queryFn: () =>
      search({
        data: {
          origin: params.origin!,
          destination: params.destination!,
          departDate: params.depart!,
          returnDate: params.ret,
          passengers: params.pax ?? 1,
          cabin: params.cabin ?? "economy",
          currency: "BRL",
          limit: 30,
        },
      }),
  });

  const offer: FlightOffer | undefined = offersQuery.data?.offers.find(
    (o) => o.id === id,
  );

  const statsQuery = useQuery({
    queryKey: [
      "route-stats",
      params.origin,
      params.destination,
      params.cabin,
    ],
    enabled: ready,
    queryFn: () =>
      routeStats({
        data: {
          origin: params.origin!,
          destination: params.destination!,
          cabin: params.cabin ?? "economy",
          days: 90,
        },
      }),
  });

  const score: MabScore | null = useMemo(() => {
    if (!offer) return null;
    const s = statsQuery.data;
    if (!s || !s.avgPrice) {
      return computeMabScoreFromStats({ price: offer.price, avgPrice: offer.price });
    }
    return computeMabScoreFromStats({
      price: offer.price,
      avgPrice: s.avgPrice,
      minPrice: s.minPrice ?? undefined,
      p25Price: s.p25Price ?? undefined,
      previousPrice: s.lastPrice ?? undefined,
      samples: s.samples,
    });
  }, [offer, statsQuery.data]);

  if (!ready) {
    return (
      <Shell>
        <Fallback
          title="Contexto de busca ausente"
          body="Volte à busca para selecionar a oferta novamente."
          action={{ label: "Nova busca", to: "/" }}
        />
      </Shell>
    );
  }

  if (offersQuery.isLoading) return <Shell><DetailSkeleton /></Shell>;

  if (offersQuery.isError) {
    return (
      <Shell>
        <Fallback
          title="Não foi possível carregar a oferta"
          body={(offersQuery.error as Error)?.message ?? "Tente novamente."}
          action={{ label: "Voltar aos resultados", onClick: () => navigate({ to: "/search", search: params }) }}
        />
      </Shell>
    );
  }

  if (!offer) {
    return (
      <Shell>
        <Fallback
          title="Oferta indisponível"
          body="Essa oferta expirou. Refaça a busca para ver as tarifas atuais."
          action={{ label: "Voltar aos resultados", onClick: () => navigate({ to: "/search", search: params }) }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Detail offer={offer} score={score} params={params} statsLoading={statsQuery.isLoading} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Header />
      {children}
      <Footer />
    </div>
  );
}

function Detail({
  offer,
  score,
  params,
  statsLoading,
}: {
  offer: FlightOffer;
  score: MabScore | null;
  params: z.infer<typeof searchSchema>;
  statsLoading: boolean;
}) {
  const origin = useAirport(offer.outbound.segments[0].originCode);
  const destination = useAirport(
    offer.outbound.segments[offer.outbound.segments.length - 1].destinationCode,
  );
  const cover = destinationImage(destination?.code ?? offer.outbound.segments.at(-1)!.destinationCode, 1800, 900);

  const [saved, setSaved] = useLocalStorage<SavedRoute[]>(KEYS.saved, []);
  const [alerts, setAlerts] = useLocalStorage<PriceAlert[]>(KEYS.alerts, []);
  const [showAlert, setShowAlert] = useState(false);
  const [target, setTarget] = useState(Math.round(offer.price * 0.9));

  const routeKey = `${offer.outbound.segments[0].originCode}-${offer.outbound.segments.at(-1)!.destinationCode}`;
  const isSaved = saved.some((s) => s.id === routeKey);

  const toggleSave = () => {
    if (isSaved) setSaved(saved.filter((s) => s.id !== routeKey));
    else
      setSaved([
        {
          id: routeKey,
          origin: offer.outbound.segments[0].originCode,
          destination: offer.outbound.segments.at(-1)!.destinationCode,
          createdAt: new Date().toISOString(),
        },
        ...saved,
      ]);
  };

  const createAlert = () => {
    setAlerts([
      {
        id: crypto.randomUUID(),
        origin: offer.outbound.segments[0].originCode,
        destination: offer.outbound.segments.at(-1)!.destinationCode,
        targetPriceBRL: target,
        createdAt: new Date().toISOString(),
      },
      ...alerts,
    ]);
    setShowAlert(false);
  };

  const passengers = params.pax ?? 1;
  const perPax = Math.round(offer.price / passengers);

  const searchParamsFull: FlightSearchParams = {
    origin: params.origin!,
    destination: params.destination!,
    departDate: params.depart!,
    returnDate: params.ret,
    passengers,
    cabin: params.cabin ?? "economy",
    currency: offer.currency,
  };
  const affiliateUrl = buildAffiliateUrl({ offer, params: searchParamsFull });

  return (
    <div className="pb-24 lg:pb-0">
      {/* Hero */}
      <div className="relative h-[38vh] min-h-[280px] w-full overflow-hidden md:h-[42vh]">
        <img
          src={cover}
          alt={destination?.city ?? offer.outbound.segments.at(-1)!.destinationCode}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
        <div className="relative mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-6">
          <Link
            to="/search"
            search={params}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs text-white/90 backdrop-blur hover:text-gold transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar
          </Link>
        </div>
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-6 md:px-8 md:pb-8">
          <div className="text-[10px] font-medium uppercase tracking-[0.32em] text-gold">
            Detalhes da oferta
          </div>
          <h1 className="mt-2 font-display text-3xl font-bold leading-tight sm:text-4xl md:text-6xl">
            <span className="block sm:inline">{origin?.city ?? offer.outbound.segments[0].originCode}</span>
            <span className="mx-2 font-serif italic font-normal text-gold-gradient sm:mx-3">→</span>
            <span className="block sm:inline">{destination?.city ?? offer.outbound.segments.at(-1)!.destinationCode}</span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Plane className="h-3.5 w-3.5 text-gold" /> {offer.airline.name}
            </span>
            <span className="hidden sm:inline">·</span>
            <span>{cabinLabel(offer.cabin)}</span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" /> {passengers} {passengers === 1 ? "pax" : "pax"}
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 md:px-8">

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Itinerary */}
          <div className="space-y-6">
            <ItineraryCard
              title="Ida"
              date={params.depart!}
              itinerary={offer.outbound}
              airline={offer.airline.name}
              cabin={offer.cabin}
            />
            {offer.return && (
              <ItineraryCard
                title="Volta"
                date={params.ret ?? ""}
                itinerary={offer.return}
                airline={offer.airline.name}
                cabin={offer.cabin}
              />
            )}

            {/* Fare details */}
            <div className="card-luxe rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold">Detalhes da tarifa</h3>
              <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <FareRow icon={<Briefcase className="h-4 w-4" />} label="Bagagem de mão" value="Incluída" />
                <FareRow icon={<Briefcase className="h-4 w-4" />} label="Bagagem despachada" value="Opcional" />
                <FareRow icon={<ShieldCheck className="h-4 w-4" />} label="Cancelamento 24h" value="Grátis" />
                <FareRow icon={<Clock className="h-4 w-4" />} label="Emissão" value="Imediata" />
              </ul>
            </div>
          </div>

          {/* Sticky booking rail */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card-luxe rounded-2xl p-6 shadow-luxe">
              {score && (
                <div
                  className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${scoreColorClass(
                    score.label,
                  )}`}
                >
                  <Sparkles className="h-3 w-3" />
                  {t("score.label")} {score.score} · {t(scoreLabelKey(score.label))}
                </div>
              )}
              <div className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
                Preço total
              </div>
              <div className="mt-1 font-display text-5xl font-extrabold tracking-tight text-gold-gradient">
                {offer.currency === "BRL"
                  ? formatBRL(offer.price)
                  : `${offer.currency} ${offer.price.toFixed(0)}`}
              </div>
              <div className="text-xs text-muted-foreground">
                {passengers > 1
                  ? `${formatBRL(perPax)} ${t("misc.perPax")}`
                  : t("misc.perPax")}
              </div>

              {offer.miles && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/5 px-3 py-2 text-xs text-gold-soft">
                  <Sparkles className="h-3.5 w-3.5" />
                  Ou {formatMiles(offer.miles)} {t("misc.miles")}
                </div>
              )}

              {score && score.savings > 0 && (
                <div className="mt-3 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                  {t("deal.savings")}: <strong>{formatBRL(score.savings)}</strong>{" "}
                  (-{score.discountPct}%)
                </div>
              )}

              <a
                href={affiliateUrl}
                target="_blank"
                rel="noopener sponsored"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-luxe transition hover:opacity-95"
              >
                Continuar para compra <ArrowRight className="h-4 w-4" />
              </a>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Você será direcionado ao parceiro de reservas.
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={toggleSave}
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition ${
                    isSaved
                      ? "border-gold text-gold bg-gold/10"
                      : "border-border text-muted-foreground hover:text-gold hover:border-gold/40"
                  }`}
                >
                  {isSaved ? <Check className="h-3.5 w-3.5" /> : <Heart className="h-3.5 w-3.5" />}
                  {isSaved ? "Salvo" : t("flight.save")}
                </button>
                <button
                  onClick={() => setShowAlert((v) => !v)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground transition hover:text-gold hover:border-gold/40"
                >
                  <Bell className="h-3.5 w-3.5" /> {t("flight.alert")}
                </button>
              </div>

              {showAlert && (
                <div className="mt-3 rounded-lg border border-gold/20 p-3">
                  <label className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {t("alerts.target")}
                  </label>
                  <input
                    type="number"
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm outline-none focus:border-gold"
                  />
                  <button
                    onClick={createAlert}
                    className="mt-2 w-full rounded-md gold-gradient py-2 text-xs font-semibold text-primary-foreground"
                  >
                    {t("alerts.create")}
                  </button>
                </div>
              )}
            </div>

            {/* Price benchmark */}
            <div className="card-luxe rounded-2xl p-6">
              <h4 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Benchmark de preço
              </h4>
              {statsLoading ? (
                <div className="mt-4 space-y-2">
                  <div className="skeleton skeleton-shimmer h-3 w-3/4 rounded" />
                  <div className="skeleton skeleton-shimmer h-3 w-1/2 rounded" />
                </div>
              ) : score ? (
                <div className="mt-3 space-y-2 text-sm">
                  <Row label="Preço atual" value={formatBRL(offer.price)} strong />
                  <Row
                    label={t("flight.avgPrice")}
                    value={
                      score.discountPct > 0
                        ? formatBRL(Math.round(offer.price + score.savings))
                        : "—"
                    }
                  />
                  <Row
                    label="Tendência"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {score.trend === "down" && <TrendingDown className="h-3.5 w-3.5 text-success" />}
                        {score.trend === "up" && <TrendingUp className="h-3.5 w-3.5 text-destructive" />}
                        {t(trendLabelKey(score.trend))}
                      </span>
                    }
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                  Sem histórico suficiente para benchmark.
                </p>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-card/95 backdrop-blur-xl safe-bottom lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Total</div>
            <div className="truncate font-display text-2xl font-extrabold tracking-tight text-gold-gradient">
              {offer.currency === "BRL"
                ? formatBRL(offer.price)
                : `${offer.currency} ${offer.price.toFixed(0)}`}
            </div>
          </div>
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener sponsored"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl gold-gradient px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-luxe"
          >
            Continuar <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}


function ItineraryCard({
  title,
  date,
  itinerary,
  airline,
  cabin,
}: {
  title: string;
  date: string;
  itinerary: FlightItinerary;
  airline: string;
  cabin: string;
}) {
  const dh = Math.floor(itinerary.durationMin / 60);
  const dm = itinerary.durationMin % 60;
  return (
    <div className="card-luxe rounded-2xl p-6 md:p-8">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
            {title}
          </div>
          <div className="mt-1 font-display text-xl font-bold">{formatDate(date)}</div>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <div>{airline}</div>
          <div>
            {dh}h{dm.toString().padStart(2, "0")} ·{" "}
            {itinerary.stops === 0
              ? t("flight.direct")
              : `${itinerary.stops} ${itinerary.stops === 1 ? t("flight.stop") : t("flight.stops_plural")}`}
          </div>
        </div>
      </div>

      <ol className="mt-6 space-y-6">
        {itinerary.segments.map((seg, i) => {
          const dep = new Date(seg.departureTime);
          const arr = new Date(seg.arrivalTime);
          const layover =
            i < itinerary.segments.length - 1
              ? layoverMinutes(
                  seg.arrivalTime,
                  itinerary.segments[i + 1].departureTime,
                )
              : null;
          const sh = Math.floor(seg.durationMin / 60);
          const sm = seg.durationMin % 60;
          return (
            <li key={i}>
              <div className="grid gap-4 md:grid-cols-[100px_1fr_100px] md:items-center">
                <div>
                  <div className="font-display text-2xl font-bold leading-none">{formatTime(dep)}</div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {seg.originCode}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{formatShortDate(dep)}</div>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                  <div className="text-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      {seg.airlineCode} {seg.flightNumber}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {sh}h{sm.toString().padStart(2, "0")}
                      {seg.aircraft ? ` · ${seg.aircraft}` : ""}
                    </div>
                  </div>
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl font-bold leading-none">{formatTime(arr)}</div>
                  <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    {seg.destinationCode}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{formatShortDate(arr)}</div>
                </div>
              </div>
              {layover != null && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3 text-gold" />
                  Conexão em {seg.destinationCode} · {Math.floor(layover / 60)}h
                  {(layover % 60).toString().padStart(2, "0")}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
          {cabinLabel(cabin)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">
          <Briefcase className="h-3 w-3" /> Bagagem de mão inclusa
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold text-foreground" : "text-foreground"}>{value}</span>
    </div>
  );
}

function FareRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/10 px-3 py-2.5">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="text-gold">{icon}</span>
        {label}
      </span>
      <span className="font-medium text-foreground">{value}</span>
    </li>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <div className="skeleton skeleton-shimmer h-8 w-40 rounded" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="skeleton skeleton-shimmer h-80 rounded-2xl" />
        <div className="skeleton skeleton-shimmer h-80 rounded-2xl" />
      </div>
    </div>
  );
}

function Fallback({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; to?: string; onClick?: () => void };
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      {action &&
        (action.to ? (
          <Link
            to={action.to}
            className="mt-6 inline-flex items-center gap-2 rounded-full gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {action.label} <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="mt-6 inline-flex items-center gap-2 rounded-full gold-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            {action.label} <ArrowRight className="h-4 w-4" />
          </button>
        ))}
    </div>
  );
}

function cabinLabel(c: string) {
  return c === "business"
    ? "Executiva"
    : c === "first"
      ? "Primeira Classe"
      : c === "premium"
        ? "Premium Economy"
        : "Econômica";
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function layoverMinutes(arrivalIso: string, nextDepartureIso: string) {
  const a = new Date(arrivalIso).getTime();
  const b = new Date(nextDepartureIso).getTime();
  return Math.max(0, Math.round((b - a) / 60000));
}
