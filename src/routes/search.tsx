import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import {
  WhatsAppSavingsModal,
  savingsModalAllowed,
  dismissSavingsModal,
  type SavingsContext,
} from "@/components/WhatsAppSavingsModal";
import { searchFlightsFn } from "@/lib/flights.functions";
import {
  MilesOfferCTA,
  MilesBanner,
  MilesNoResults,
  type MilesContext,
} from "@/components/MilesEmission";
import {
  getNearbyDatesFn,
  getPopularFromCityFn,
} from "@/lib/deals/travelpayouts-deals.functions";
import { RecoveryOffers } from "@/components/OffersSections";
import { INTERNATIONAL_OFFERS } from "@/lib/offers-catalog";
import type { FlightOffer } from "@/lib/flights/types";
import { formatBRL, t } from "@/lib/i18n";
import { Plane, ArrowRight, SearchX, Sparkles, Briefcase, CalendarDays, MessageCircle } from "lucide-react";

const cabinEnum = z.enum(["economy", "premium", "business", "first"]);

const searchSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  depart: z.string().optional(),
  ret: z.string().optional(),
  pax: z.number().optional(),
  cabin: cabinEnum.optional(),
});

export const Route = createFileRoute("/search")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Resultados da busca — TRIPmoc" },
      { name: "description", content: "Compare voos e ofertas com o MAB Score." },
      { property: "og:title", content: "Resultados da busca — TRIPmoc" },
      { property: "og:description", content: "Melhores tarifas identificadas em tempo real." },
    ],
  }),
  component: SearchResults,
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="font-display text-2xl">Não foi possível carregar os resultados</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
      <Footer />
    </div>
  ),
});

type Sort = "price" | "score" | "duration";

function SearchResults() {
  const params = Route.useSearch();
  const [sort, setSort] = useState<Sort>("score");
  const search = useServerFn(searchFlightsFn);

  const ready = !!(params.origin && params.destination && params.depart);

  const query = useQuery({
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

  const offers: FlightOffer[] = query.data?.offers ?? [];
  const cheapest = offers.length ? Math.min(...offers.map((o) => o.price)) : 0;

  const milesCtx: MilesContext = {
    origin: params.origin,
    destination: params.destination,
    departDate: params.depart,
    returnDate: params.ret,
    passengers: params.pax ?? 1,
    currency: "BRL",
  };

  const sorted = [...offers].sort((a, b) => {
    if (sort === "price") return a.price - b.price;
    if (sort === "duration") return a.durationMin - b.durationMin;
    return a.price - b.price;
  });

  const [modalCtx, setModalCtx] = useState<SavingsContext | null>(null);

  const openModal = useCallback(
    (offer: FlightOffer) => {
      setModalCtx({
        origin: params.origin ?? offer.outbound.segments[0]?.originCode ?? "",
        destination: params.destination ?? "",
        date: params.depart ?? "",
        price: offer.price,
        currency: offer.currency,
      });
    },
    [params.origin, params.destination, params.depart],
  );

  // Auto-open once per session, 7s after results are visible.
  useEffect(() => {
    if (!sorted.length) return;
    if (!savingsModalAllowed()) return;
    const timer = window.setTimeout(() => {
      if (!savingsModalAllowed()) return;
      const best = sorted.reduce((a, b) => (a.price <= b.price ? a : b));
      openModal(best);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [sorted.length, openModal]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeModal = useCallback(() => {
    dismissSavingsModal();
    setModalCtx(null);
  }, []);


  return (
    <div className="min-h-screen">
      <Header />

      {/* Compact search bar */}
      <div className="border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <FlightSearchForm compact />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        {/* Header row */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-brand">
              {t("results.title")}
            </div>
            <h1 className="mt-2 font-display text-3xl font-bold leading-tight md:text-4xl">
              {params.origin && params.destination ? (
                <>
                  <span className="font-mono">{params.origin}</span>
                  <span className="mx-3 font-serif font-normal text-brand">→</span>
                  <span className="font-mono">{params.destination}</span>
                </>
              ) : (
                "Buscar voos"
              )}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {query.isLoading
                ? "Analisando tarifas em tempo real…"
                : `${sorted.length} ${t("results.found")}`}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 p-1 backdrop-blur">
            {(["score", "price", "duration"] as Sort[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition ${
                  sort === s
                    ? "bg-cta text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t(`results.sort.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {!ready && (
          <EmptyState
            title="Informe origem, destino e data"
            body="Use a barra de busca acima para começar."
          />
        )}

        {ready && query.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {ready && query.isError && (
          <EmptyState
            title="Falha na busca"
            body={(query.error as Error)?.message ?? "Tente novamente em instantes."}
          />
        )}

        {ready && !query.isLoading && !query.isError && sorted.length === 0 && (
          <div className="space-y-6">
            <MilesNoResults ctx={milesCtx} />
            <NoOffersState
              origin={params.origin!}
              destination={params.destination!}
              departDate={params.depart!}
            />
          </div>
        )}

        <div className="space-y-3 pb-20">
          {sorted.map((o, idx) => (
            <div key={o.id} className="space-y-2">
              <FlightRow
                offer={o}
                cheapest={cheapest}
                index={idx}
                onWantSavings={() => openModal(o)}
              />
              <MilesOfferCTA ctx={{ ...milesCtx, price: o.price, currency: o.currency }} />
            </div>
          ))}

          {sorted.length > 0 && (
            <div className="pt-6">
              <MilesBanner ctx={milesCtx} />
            </div>
          )}
        </div>
      </div>

      <WhatsAppSavingsModal open={!!modalCtx} onClose={closeModal} context={modalCtx} />
      <Footer />
    </div>
  );
}

function FlightRow({
  offer: o,
  cheapest,
  index,
  onWantSavings,
}: {
  offer: FlightOffer;
  cheapest: number;
  index: number;
  onWantSavings: () => void;
}) {
  const dh = Math.floor(o.durationMin / 60);
  const dm = o.durationMin % 60;
  const dep = new Date(o.departureTime);
  const arr = new Date(o.arrivalTime);
  const fmt = (d: Date) =>
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const isBest = o.price === cheapest;
  const firstSeg = o.outbound.segments[0];
  const lastSeg = o.outbound.segments[o.outbound.segments.length - 1];

  return (
    <div
      className="group relative block overflow-hidden rounded-2xl card-luxe transition-all duration-300 hover:-translate-y-0.5 hover:border-border hover:shadow-luxe animate-rise"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {isBest && (
        <span className="absolute left-0 top-0 rounded-br-lg bg-cta px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-primary-foreground">
          Melhor preço
        </span>
      )}
      <div className="grid gap-5 p-5 md:grid-cols-[220px_1fr_200px] md:items-center md:gap-8 md:p-6">
        {/* Airline */}
        <div className="flex items-center gap-3">
          <span
            className="grid h-12 w-12 shrink-0 place-items-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: "#c9a84c" }}
          >
            {o.airline.code}
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{o.airline.name}</div>
            <div className="text-[11px] text-muted-foreground">
              {o.cabin ? cabinLabel(o.cabin) : "Econômica"}
            </div>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-4">
          <div className="text-left">
            <div className="font-display text-3xl font-bold leading-none tracking-tight">
              {fmt(dep)}
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {firstSeg?.originCode}
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center gap-1">
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
              {dh}h{dm.toString().padStart(2, "0")}
            </div>
            <div className="relative flex w-full items-center">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-cta/40 to-transparent" />
              <Plane className="h-3.5 w-3.5 rotate-90 text-brand" />
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-cta/40 to-transparent" />
            </div>
            <div className="text-[10px] text-muted-foreground">
              {o.stops === 0
                ? t("flight.direct")
                : `${o.stops} ${o.stops === 1 ? t("flight.stop") : t("flight.stops_plural")}`}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-bold leading-none tracking-tight">
              {fmt(arr)}
            </div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {lastSeg?.destinationCode}
            </div>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex flex-col gap-3 border-t border-border pt-4 md:items-end md:border-l md:border-t-0 md:pl-6 md:pt-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Total
            </div>
            <div className="mt-0.5 font-display text-3xl font-extrabold tracking-tight text-foreground">
              {o.currency === "BRL"
                ? formatBRL(o.price)
                : `${o.currency} ${o.price.toFixed(0)}`}
            </div>
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-border bg-accent px-2.5 py-1 text-[10px] font-medium text-brand-soft">
              <Sparkles className="h-2.5 w-2.5" /> 💰 Economia estimada com milhas: até 40%
            </div>
            <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
              <Briefcase className="h-3 w-3" /> Bagagem de mão inclusa
            </div>
          </div>

          <button
            type="button"
            onClick={onWantSavings}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp px-5 py-3 text-xs font-bold uppercase tracking-wide text-whatsapp-foreground shadow-luxe transition hover:brightness-110 active:scale-[0.99] md:w-auto"
          >
            <MessageCircle className="h-4 w-4" /> Quero economizar
          </button>

          <Link
            to="/flight/$id"
            params={{ id: o.id }}
            search={(prev: Record<string, unknown>) => ({ ...prev })}
            className="inline-flex items-center gap-1 self-center text-[11px] font-semibold text-muted-foreground transition hover:text-cta md:self-end"
          >
            Ver detalhes <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
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

function SkeletonRow() {
  return (
    <div className="grid gap-5 rounded-2xl card-luxe p-5 md:grid-cols-[220px_1fr_200px] md:items-center md:gap-8 md:p-6">
      <div className="flex items-center gap-3">
        <div className="skeleton skeleton-shimmer h-12 w-12 rounded-xl" />
        <div className="space-y-2">
          <div className="skeleton skeleton-shimmer h-3 w-24 rounded" />
          <div className="skeleton skeleton-shimmer h-2 w-16 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="skeleton skeleton-shimmer h-9 w-16 rounded" />
        <div className="skeleton skeleton-shimmer h-px flex-1 rounded" />
        <div className="skeleton skeleton-shimmer h-9 w-16 rounded" />
      </div>
      <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
        <div className="skeleton skeleton-shimmer h-8 w-24 rounded" />
        <div className="skeleton skeleton-shimmer h-8 w-28 rounded-full" />
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl card-luxe p-16 text-center">
      <SearchX className="mx-auto h-10 w-10 text-brand" />
      <h2 className="mt-4 font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function NoOffersState({
  origin,
  destination,
  departDate,
}: {
  origin: string;
  destination: string;
  departDate: string;
}) {
  const navigate = useNavigate();
  const fetchNearby = useServerFn(getNearbyDatesFn);
  const fetchPopular = useServerFn(getPopularFromCityFn);

  const nearby = useQuery({
    queryKey: ["nearby", origin, destination, departDate],
    queryFn: () =>
      fetchNearby({ data: { origin, destination, around: departDate } }),
    staleTime: 5 * 60 * 1000,
  });

  const popular = useQuery({
    queryKey: ["popular", origin],
    queryFn: () => fetchPopular({ data: { origin, limit: 6 } }),
    staleTime: 5 * 60 * 1000,
  });

  const dates = (nearby.data ?? []).slice(0, 6);
  const suggestions = popular.data ?? [];

  function fmt(iso: string) {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  }

  return (
    <div className="space-y-10">
      <div className="rounded-3xl card-luxe p-10 text-center">
        <SearchX className="mx-auto h-10 w-10 text-brand" />
        <h2 className="mt-4 font-display text-2xl font-bold">
          Ainda não há tarifa publicada para esta data — mas há saída.
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
          Não encontramos tarifa em cache para{" "}
          <span className="font-mono">{origin}</span> →{" "}
          <span className="font-mono">{destination}</span> em {fmt(departDate)}. Veja datas
          próximas, outras oportunidades abaixo ou fale com um consultor agora.
        </p>
      </div>

      {dates.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-brand">
            <CalendarDays className="h-3.5 w-3.5" /> Datas próximas com tarifa
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {dates.map((d) => (
              <button
                key={d.date}
                onClick={() =>
                  navigate({
                    to: "/search",
                    search: { origin, destination, depart: d.date } as never,
                  })
                }
                className="group flex items-center justify-between rounded-2xl border border-border bg-card/50 p-4 text-left transition hover:border-border"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    Partida
                  </div>
                  <div className="mt-1 font-display text-lg font-bold">{fmt(d.date)}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl font-extrabold text-foreground">
                    {formatBRL(d.price)}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Preço indicativo
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-brand">
            <Sparkles className="h-3.5 w-3.5" /> Destinos populares partindo de {origin}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((s) => (
              <DealCard key={s.id} deal={s} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-brand">
          <Sparkles className="h-3.5 w-3.5" /> Outras oportunidades para você
        </div>
        <RecoveryOffers scope={INTERNATIONAL_OFFERS.some((o) => o.code === destination?.toUpperCase()) ? "international" : "national"} />
      </section>
    </div>
  );
}
