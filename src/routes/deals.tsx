import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Filter, Plane, Globe2, Sparkles, X, Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { getCuratedDealsFn } from "@/lib/deals/travelpayouts-deals.functions";
import type { RealDeal } from "@/lib/deals/types";
import { t, formatBRL } from "@/lib/i18n";

const schema = z.object({
  tab: z.enum(["all", "domestic", "international"]).optional(),
});

export const Route = createFileRoute("/deals")({
  validateSearch: (s) => schema.parse(s),
  head: () => ({
    meta: [
      { title: "MAB Deals — Melhores oportunidades de voos" },
      {
        name: "description",
        content:
          "Painel premium de ofertas: passagens nacionais e internacionais com preços monitorados em tempo real.",
      },
      { property: "og:title", content: "MAB Deals — Melhores oportunidades de voos" },
      {
        property: "og:description",
        content: "Descubra automaticamente as melhores ofertas nacionais e internacionais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DealsPage,
});

const REGION_BY_COUNTRY: Record<string, string> = {
  EUA: "América do Norte",
  Canadá: "América do Norte",
  México: "América do Norte",
  Argentina: "América Latina",
  Chile: "América Latina",
  Colômbia: "América Latina",
  Peru: "América Latina",
  Uruguai: "América Latina",
  Portugal: "Europa",
  Espanha: "Europa",
  França: "Europa",
  Itália: "Europa",
  "Reino Unido": "Europa",
  Alemanha: "Europa",
  Holanda: "Europa",
  "Emirados Árabes": "Oriente Médio",
  Catar: "Oriente Médio",
  Turquia: "Oriente Médio",
  Japão: "Ásia",
  China: "Ásia",
  Tailândia: "Ásia",
};
function regionOf(d: RealDeal): string {
  if (d.destinationCountry === "Brasil") return "Brasil";
  return REGION_BY_COUNTRY[d.destinationCountry] ?? "Outros";
}

type Tab = "all" | "domestic" | "international";
const PRICE_MAX = 8000;

function DealsPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<Tab>(search.tab ?? "all");
  const [origin, setOrigin] = useState<string>("GRU");
  const [region, setRegion] = useState<string>("all");
  const [priceMax, setPriceMax] = useState<number>(PRICE_MAX);
  const [showFilters, setShowFilters] = useState(false);

  const fetchCurated = useServerFn(getCuratedDealsFn);
  const query = useQuery({
    queryKey: ["curated-deals", origin],
    queryFn: () => fetchCurated({ data: { origin, limit: 60 } }),
    staleTime: 5 * 60 * 1000,
  });
  const deals: RealDeal[] = query.data ?? [];

  const origins = useMemo(() => ["GRU", "GIG", "BSB", "CGH", "POA", "REC"], []);
  const regions = useMemo(
    () => Array.from(new Set(deals.map(regionOf))).sort(),
    [deals],
  );

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      if (region !== "all" && regionOf(d) !== region) return false;
      if (typeof d.price === "number" && d.price > priceMax) return false;
      return true;
    });
  }, [deals, region, priceMax]);

  const sections: { id: Exclude<Tab, "all">; title: string; icon: typeof Plane; items: RealDeal[] }[] = [
    { id: "domestic", title: t("deals.domestic"), icon: Plane, items: filtered.filter((d) => d.category === "domestic") },
    { id: "international", title: t("deals.international"), icon: Globe2, items: filtered.filter((d) => d.category === "international") },
  ];
  const visibleSections = tab === "all" ? sections : sections.filter((s) => s.id === tab);
  const totalCount = visibleSections.reduce((n, s) => n + s.items.length, 0);

  const activeFilters =
    (origin !== "GRU" ? 1 : 0) + (region !== "all" ? 1 : 0) + (priceMax < PRICE_MAX ? 1 : 0);

  function reset() {
    setOrigin("GRU");
    setRegion("all");
    setPriceMax(PRICE_MAX);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "domestic", label: t("deals.domestic") },
    { id: "international", label: t("deals.international") },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      <section className="relative overflow-hidden border-b border-gold/10">
        <div aria-hidden className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-obsidian)" }} />
        <div
          aria-hidden
          className="absolute -top-24 right-[-10%] h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--gradient-gold)", opacity: 0.12 }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold-soft">
            <Sparkles className="h-3 w-3" /> MAB Deals
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
            <span className="text-gold-gradient">As melhores oportunidades</span>
            <br className="hidden md:block" /> de viagem, monitoradas em tempo real.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Ofertas nacionais e internacionais capturadas via nossos parceiros. Preços indicativos, confirmados no checkout.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-1 rounded-full border border-gold/15 bg-card/60 p-1 backdrop-blur">
            {tabs.map((tb) => {
              const active = tab === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                    active ? "bg-gold text-primary-foreground shadow-luxe" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tb.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-card/40 px-3 py-1.5 text-xs text-foreground hover:border-gold/40"
          >
            <Filter className="h-3.5 w-3.5 text-gold" />
            Filtros
            {activeFilters > 0 && (
              <span className="ml-1 rounded-full bg-gold px-1.5 text-[10px] font-bold text-primary-foreground">
                {activeFilters}
              </span>
            )}
          </button>
          <div className="text-xs text-muted-foreground">
            {query.isLoading ? "Carregando…" : `${totalCount} ${totalCount === 1 ? "oferta" : "ofertas"}`}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 rounded-2xl border border-gold/15 bg-card/60 p-4 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Aeroporto de origem">
                <select value={origin} onChange={(e) => setOrigin(e.target.value)} className="filter-input">
                  {origins.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="Região de destino">
                <select value={region} onChange={(e) => setRegion(e.target.value)} className="filter-input">
                  <option value="all">Todas</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              <Field label={`Preço até ${formatBRL(priceMax)}`}>
                <input
                  type="range"
                  min={200}
                  max={PRICE_MAX}
                  step={100}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full accent-[color:var(--gold)]"
                />
              </Field>
            </div>

            {activeFilters > 0 && (
              <button
                onClick={reset}
                className="mt-4 inline-flex items-center gap-1 text-xs text-gold-soft hover:text-gold"
              >
                <X className="h-3 w-3" /> Limpar filtros
              </button>
            )}
          </div>
        )}

        <div className="mt-10 space-y-14">
          {query.isLoading && (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-gold" /> Carregando ofertas monitoradas…
            </div>
          )}

          {!query.isLoading &&
            visibleSections.map((section) => (
              <section key={section.id}>
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gold-soft">
                      <section.icon className="h-3.5 w-3.5" />
                      Seção
                    </div>
                    <h2 className="mt-1 font-display text-2xl md:text-3xl">{section.title}</h2>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {section.items.length} {section.items.length === 1 ? "oferta" : "ofertas"}
                  </div>
                </div>

                {section.items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gold/15 bg-card/30 p-8 text-center text-sm text-muted-foreground">
                    Sem ofertas em cache para os filtros atuais. Ajuste a origem ou faça uma busca direta.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {section.items.map((d) => (
                      <DealCard key={d.id} deal={d} />
                    ))}
                  </div>
                )}
              </section>
            ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      {children}
    </label>
  );
}
