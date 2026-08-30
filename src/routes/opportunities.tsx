import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, TrendingDown, Flame, LineChart, Plane, RefreshCw, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getOpportunitiesOfTheDayFn, type OpportunityInsight } from "@/lib/discovery.functions";
import { destinationImage } from "@/lib/destination-images";
import { formatBRL, t } from "@/lib/i18n";
import { scoreColorClass, scoreLabelKey } from "@/lib/mab-score";

export const Route = createFileRoute("/opportunities")({
  head: () => ({
    meta: [
      { title: "Oportunidades do dia — MAB Flights" },
      {
        name: "description",
        content:
          "Feed automático das melhores oportunidades de passagens: preços incomuns, quedas recentes e rotas abaixo da média histórica.",
      },
      { property: "og:title", content: "Oportunidades do dia — MAB Flights" },
      {
        property: "og:description",
        content:
          "Descoberta automática de voos baratos monitorada continuamente pelo motor MAB.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OpportunitiesPage,
});

type RegionFilter = "all" | "domestic" | "south_america" | "usa" | "europe";

const REGION_LABEL: Record<Exclude<RegionFilter, "all">, string> = {
  domestic: "Brasil",
  south_america: "América do Sul",
  usa: "Estados Unidos",
  europe: "Europa",
};

const REASON_META: Record<
  OpportunityInsight["reasons"][number],
  { label: string; icon: typeof Flame; className: string }
> = {
  unusual_low: {
    label: "Preço incomum",
    icon: Flame,
    className: "text-brand border-border bg-accent",
  },
  price_drop: {
    label: "Queda recente",
    icon: TrendingDown,
    className: "text-success border-success/40 bg-success/10",
  },
  below_average: {
    label: "Abaixo da média",
    icon: LineChart,
    className: "text-foreground border-border bg-muted/40",
  },
};

function OpportunitiesPage() {
  const router = useRouter();
  const [region, setRegion] = useState<RegionFilter>("all");
  const fetchFeed = useServerFn(getOpportunitiesOfTheDayFn);

  const query = useQuery({
    queryKey: ["opportunities", "economy"],
    queryFn: () => fetchFeed({ data: { cabin: "economy", minDiscountPct: 12, limit: 40 } }),
    staleTime: 5 * 60_000,
  });

  const items = query.data ?? [];
  const filtered = useMemo(
    () => (region === "all" ? items : items.filter((o) => o.region === region)),
    [items, region],
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-black to-background">
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(212,175,55,0.18), transparent 55%), radial-gradient(circle at 80% 60%, rgba(212,175,55,0.10), transparent 50%)",
            }}
          />
          <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-brand">
              <Sparkles className="h-3 w-3" /> MAB Discovery Engine
            </div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-white md:text-6xl">
              Oportunidades do dia
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-base">
              O motor MAB monitora rotas populares 24/7 e destaca aqui apenas os preços incomuns,
              quedas recentes e voos abaixo da média histórica.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              {(["all", "domestic", "south_america", "usa", "europe"] as RegionFilter[]).map(
                (r) => {
                  const active = region === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRegion(r)}
                      className={`rounded-full border px-3.5 py-1.5 text-xs transition ${
                        active
                          ? "border-border bg-accent text-brand"
                          : "border-border text-white/70 hover:text-white hover:border-border"
                      }`}
                    >
                      {r === "all" ? "Todas as regiões" : REGION_LABEL[r]}
                    </button>
                  );
                },
              )}
              <button
                onClick={() => {
                  query.refetch();
                  router.invalidate();
                }}
                className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-white/70 hover:text-cta hover:border-border transition"
              >
                <RefreshCw className={`h-3 w-3 ${query.isFetching ? "animate-spin" : ""}`} />
                Atualizar
              </button>
            </div>
          </div>
        </section>

        {/* Feed */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          {query.isLoading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando oportunidades…
            </div>
          ) : query.error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-sm text-destructive">
              Não foi possível carregar as oportunidades: {(query.error as Error).message}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-border/60 bg-card/50 p-10 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-brand" />
              <h2 className="mt-3 font-display text-xl">Nenhuma oportunidade nessa região agora</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O motor está observando. Volte em breve — as oportunidades aparecem assim que os
                preços caem abaixo da média histórica.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((o, i) => (
                <OpportunityCard key={`${o.origin}-${o.destination}-${i}`} o={o} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function OpportunityCard({ o }: { o: OpportunityInsight }) {
  const img = destinationImage(o.destination);
  return (
    <Link
      to="/search"
      search={{
        origin: o.origin,
        destination: o.destination,
        depart: new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10),
        pax: 1,
        cabin: "economy" as const,
      }}
      className="group block overflow-hidden rounded-3xl card-luxe transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe hover:border-border"
    >
      <div className="relative aspect-[5/4] overflow-hidden">
        <img
          src={img}
          alt={o.destination}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

        <span
          className={`absolute top-4 left-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md ${scoreColorClass(o.score.label)}`}
        >
          {t(scoreLabelKey(o.score.label))}
        </span>
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-success backdrop-blur-md">
          <TrendingDown className="h-3 w-3" /> -{o.discountPct}%
        </span>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/60">
            {o.region === "other" ? "Rota monitorada" : REGION_LABEL[o.region]}
          </div>
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-white">
            {o.destination}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-white/75">
            <span className="font-mono tracking-wider">{o.origin}</span>
            <span className="h-px w-6 bg-accent" />
            <Plane className="h-3 w-3 text-brand" />
            <span className="h-px w-6 bg-accent" />
            <span className="font-mono tracking-wider">{o.destination}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-1.5">
          {o.reasons.map((r) => {
            const meta = REASON_META[r];
            const Icon = meta.icon;
            return (
              <span
                key={r}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.className}`}
              >
                <Icon className="h-2.5 w-2.5" /> {meta.label}
              </span>
            );
          })}
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              A partir de
            </div>
            <div className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
              {formatBRL(o.price)}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground line-through">
              {formatBRL(o.avgPrice)}
            </div>
          </div>
          <div className="text-right text-[10px] text-muted-foreground">
            <div>Mín. histórico</div>
            <div className="mt-0.5 text-foreground/80">{formatBRL(o.minPrice)}</div>
            <div className="mt-1 text-success">{o.samples} amostras</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
