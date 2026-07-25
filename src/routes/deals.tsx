import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState } from "react";
import { Filter, Plane, Globe2, Sparkles, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { DEALS, type Deal } from "@/lib/mock-data";
import { t, formatBRL } from "@/lib/i18n";

const schema = z.object({ tab: z.enum(["all", "domestic", "international", "miles"]).optional() });

export const Route = createFileRoute("/deals")({
  validateSearch: (s) => schema.parse(s),
  head: () => ({
    meta: [
      { title: "MAB Deals — Melhores oportunidades de voos" },
      {
        name: "description",
        content:
          "Painel premium de ofertas: passagens nacionais, internacionais e achados com milhas classificados pelo MAB Score.",
      },
      { property: "og:title", content: "MAB Deals — Melhores oportunidades de voos" },
      {
        property: "og:description",
        content: "Descubra automaticamente as melhores ofertas nacionais, internacionais e com milhas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DealsPage,
});

// --- Region mapping (destination country → region) ----------------------------
const REGION_BY_COUNTRY: Record<string, string> = {
  "EUA": "América do Norte",
  "Canadá": "América do Norte",
  "México": "América do Norte",
  "Argentina": "América Latina",
  "Chile": "América Latina",
  "Colômbia": "América Latina",
  "Peru": "América Latina",
  "Uruguai": "América Latina",
  "Portugal": "Europa",
  "Espanha": "Europa",
  "França": "Europa",
  "Itália": "Europa",
  "Reino Unido": "Europa",
  "Alemanha": "Europa",
  "Holanda": "Europa",
  "Emirados Árabes": "Oriente Médio",
  "Catar": "Oriente Médio",
  "Turquia": "Oriente Médio",
  "Japão": "Ásia",
  "China": "Ásia",
  "Tailândia": "Ásia",
};
function regionOf(d: Deal): string {
  if (d.destination.country === "Brasil") return "Brasil";
  return REGION_BY_COUNTRY[d.destination.country] ?? "Outros";
}

type Tab = "all" | "domestic" | "international" | "miles";
type Payment = "any" | "cash" | "miles";

const PRICE_MAX = 8000;

function DealsPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<Tab>(search.tab ?? "all");
  const [origin, setOrigin] = useState<string>("all");
  const [region, setRegion] = useState<string>("all");
  const [payment, setPayment] = useState<Payment>("any");
  const [priceMax, setPriceMax] = useState<number>(PRICE_MAX);
  const [showFilters, setShowFilters] = useState(false);

  // Filter options derived from data
  const origins = useMemo(
    () => Array.from(new Set(DEALS.map((d) => d.origin.code))).sort(),
    [],
  );
  const regions = useMemo(
    () => Array.from(new Set(DEALS.map(regionOf))).sort(),
    [],
  );

  const filtered = useMemo(() => {
    return DEALS.filter((d) => {
      if (origin !== "all" && d.origin.code !== origin) return false;
      if (region !== "all" && regionOf(d) !== region) return false;
      if (payment === "miles" && !d.miles) return false;
      if (payment === "cash" && d.miles) return false;
      if (d.priceBRL > priceMax) return false;
      return true;
    });
  }, [origin, region, payment, priceMax]);

  const sections: { id: Exclude<Tab, "all">; title: string; icon: typeof Plane; items: Deal[] }[] = [
    { id: "domestic", title: t("deals.domestic"), icon: Plane, items: filtered.filter((d) => d.category === "domestic") },
    { id: "international", title: t("deals.international"), icon: Globe2, items: filtered.filter((d) => d.category === "international") },
    { id: "miles", title: t("deals.miles"), icon: Sparkles, items: filtered.filter((d) => d.category === "miles") },
  ];
  const visibleSections = tab === "all" ? sections : sections.filter((s) => s.id === tab);
  const totalCount = visibleSections.reduce((n, s) => n + s.items.length, 0);

  const activeFilters =
    (origin !== "all" ? 1 : 0) +
    (region !== "all" ? 1 : 0) +
    (payment !== "any" ? 1 : 0) +
    (priceMax < PRICE_MAX ? 1 : 0);

  function reset() {
    setOrigin("all");
    setRegion("all");
    setPayment("any");
    setPriceMax(PRICE_MAX);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "domestic", label: t("deals.domestic") },
    { id: "international", label: t("deals.international") },
    { id: "miles", label: t("deals.miles") },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gold/10">
        <div
          aria-hidden
          className="absolute inset-0 opacity-40"
          style={{ background: "var(--gradient-obsidian)" }}
        />
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
            <br className="hidden md:block" /> de viagem, curadas para você.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            Ofertas nacionais, internacionais e achados com milhas — analisadas em tempo real pelo MAB Score.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        {/* Tabs */}
        <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <div className="flex min-w-max gap-1 rounded-full border border-gold/15 bg-card/60 p-1 backdrop-blur">
            {tabs.map((tb) => {
              const active = tab === tb.id;
              return (
                <button
                  key={tb.id}
                  onClick={() => setTab(tb.id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition ${
                    active
                      ? "bg-gold text-primary-foreground shadow-luxe"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tb.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter bar */}
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
            {totalCount} {totalCount === 1 ? "oferta" : "ofertas"}
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 rounded-2xl border border-gold/15 bg-card/60 p-4 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Aeroporto de origem">
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="filter-input"
                >
                  <option value="all">Todos</option>
                  {origins.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>

              <Field label="Região de destino">
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="filter-input"
                >
                  <option value="all">Todas</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              <Field label="Pagamento">
                <div className="flex rounded-lg border border-border p-0.5">
                  {(["any", "cash", "miles"] as Payment[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPayment(p)}
                      className={`flex-1 rounded-md px-2 py-1.5 text-xs transition ${
                        payment === p
                          ? "bg-gold text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {p === "any" ? "Ambos" : p === "cash" ? "Dinheiro" : "Milhas"}
                    </button>
                  ))}
                </div>
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

        {/* Sections */}
        <div className="mt-10 space-y-14">
          {visibleSections.map((section) => (
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
                  Nenhuma oferta encontrada com os filtros atuais.
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
