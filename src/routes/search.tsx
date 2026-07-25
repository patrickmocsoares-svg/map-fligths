import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { searchFlightsFn } from "@/lib/flights.functions";
import type { FlightOffer } from "@/lib/flights/types";
import { formatBRL, t } from "@/lib/i18n";
import { Plane, ChevronRight, Loader2, SearchX } from "lucide-react";

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
      { title: "Resultados da busca — MAB Flights" },
      { name: "description", content: "Compare voos e ofertas com o MAB Score." },
      { property: "og:title", content: "Resultados da busca — MAB Flights" },
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
  const sorted = [...offers].sort((a, b) => {
    if (sort === "price") return a.price - b.price;
    if (sort === "duration") return a.durationMin - b.durationMin;
    // score sort: cheaper + shorter as heuristic (score computed elsewhere)
    return a.price - b.price;
  });

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <FlightSearchForm compact />
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl">{t("results.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {params.origin && params.destination
                ? `${params.origin} → ${params.destination} · `
                : ""}
              {query.isLoading
                ? "Buscando..."
                : `${sorted.length} ${t("results.found")}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {t("results.sort")}
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
            >
              <option value="score">{t("results.sort.score")}</option>
              <option value="price">{t("results.sort.price")}</option>
              <option value="duration">{t("results.sort.duration")}</option>
            </select>
          </div>
        </div>

        {!ready && (
          <EmptyState
            title="Informe origem, destino e data"
            body="Use a barra de busca acima para começar."
          />
        )}

        {ready && query.isLoading && (
          <div className="flex items-center justify-center gap-3 rounded-xl card-luxe p-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            Buscando as melhores tarifas...
          </div>
        )}

        {ready && query.isError && (
          <EmptyState
            title="Falha na busca"
            body={(query.error as Error)?.message ?? "Tente novamente em instantes."}
          />
        )}

        {ready && !query.isLoading && !query.isError && sorted.length === 0 && (
          <EmptyState
            title="Nenhum voo encontrado"
            body="Tente outras datas ou aeroportos próximos."
          />
        )}

        <div className="space-y-3 pb-16">
          {sorted.map((o) => {
            const dh = Math.floor(o.durationMin / 60);
            const dm = o.durationMin % 60;
            const dep = new Date(o.departureTime);
            const arr = new Date(o.arrivalTime);
            const fmt = (d: Date) =>
              d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return (
              <Link
                key={o.id}
                to="/flight/$id"
                params={{ id: o.id }}
                className="grid md:grid-cols-[auto_1fr_auto] items-center gap-4 md:gap-6 rounded-xl card-luxe p-4 md:p-5 hover:border-gold/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gold/10 text-xs font-bold text-gold">
                    {o.airline.code}
                  </span>
                  <div className="text-xs">
                    <div className="font-medium">{o.airline.name}</div>
                    <div className="text-muted-foreground">
                      {o.stops === 0
                        ? t("flight.direct")
                        : `${o.stops} ${o.stops === 1 ? t("flight.stop") : t("flight.stops_plural")}`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center min-w-16">
                    <div className="font-display text-xl">{fmt(dep)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {o.outbound.segments[0]?.originCode ?? params.origin}
                    </div>
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-gold/20" />
                    <Plane className="h-3 w-3 text-gold" />
                    <span>
                      {dh}h{dm.toString().padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-gold/20" />
                  </div>
                  <div className="text-center min-w-16">
                    <div className="font-display text-xl">{fmt(arr)}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {o.outbound.segments[o.outbound.segments.length - 1]?.destinationCode ??
                        params.destination}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-3">
                  <div className="text-right">
                    <div className="font-display text-2xl text-gold-gradient">
                      {o.currency === "BRL" ? formatBRL(o.price) : `${o.currency} ${o.price.toFixed(0)}`}
                    </div>
                    {o.miles && (
                      <div className="text-[10px] text-muted-foreground">
                        ou {o.miles.toLocaleString("pt-BR")} milhas
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gold" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl card-luxe p-10 text-center">
      <SearchX className="mx-auto h-8 w-8 text-gold/70" />
      <h2 className="mt-3 font-display text-xl">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
