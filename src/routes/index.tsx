import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, TrendingDown, ShieldCheck, Globe2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import { DEALS } from "@/lib/mock-data";
import { t } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAB Flights — Ofertas premium de voos no Brasil e no mundo" },
      { name: "description", content: "Encontre a melhor oportunidade de voo com o MAB Score. Milhas, ofertas nacionais e internacionais em um só lugar." },
      { property: "og:title", content: "MAB Flights — Transformando milhas em oportunidades" },
      { property: "og:description", content: "Ofertas premium de voos analisadas em tempo real. Descubra sua próxima viagem." },
    ],
  }),
  component: Home,
});

function Section({ id, title, subtitle, deals }: { id: string; title: string; subtitle?: string; deals: typeof DEALS }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 md:px-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Link to="/deals" search={{ tab: id }} className="hidden md:inline text-sm text-gold hover:text-gold-soft">
          {t("deals.viewAll")} →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </section>
  );
}

function Home() {
  const domestic = DEALS.filter((d) => d.category === "domestic").slice(0, 6);
  const international = DEALS.filter((d) => d.category === "international").slice(0, 6);
  const miles = DEALS.filter((d) => d.category === "miles").slice(0, 3);

  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.82_0.13_88/0.15),_transparent_60%)]" />
        </div>
        <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 md:px-8 md:pt-24 md:pb-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] text-gold">
              <Sparkles className="h-3 w-3" /> Premium Travel Marketplace
            </div>
            <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[1.02]">
              Transformando <span className="text-gold-gradient">milhas</span>
              <br />em oportunidades.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
              Analisamos milhares de tarifas por hora para encontrar as melhores ofertas de voos no Brasil e para o mundo — com o exclusivo <span className="text-gold">MAB Score</span>.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-5xl">
            <FlightSearchForm />
          </div>

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
            <Highlight icon={<TrendingDown className="h-4 w-4" />} label="Economia média" value="42%" />
            <Highlight icon={<Globe2 className="h-4 w-4" />} label="Destinos monitorados" value="+180" />
            <Highlight icon={<Sparkles className="h-4 w-4" />} label="MAB Score exclusivo" value="24/7" />
            <Highlight icon={<ShieldCheck className="h-4 w-4" />} label="Preços verificados" value="Real-time" />
          </div>
        </div>
      </section>

      <Section id="domestic" title={t("deals.domestic")} subtitle="Rotas nacionais com preços abaixo da média histórica" deals={domestic} />
      <Section id="international" title={t("deals.international")} subtitle="Do Brasil para o mundo — analisadas pelo MAB Score" deals={international} />
      <Section id="miles" title={t("deals.miles")} subtitle="Oportunidades imperdíveis usando milhas" deals={miles} />

      <Footer />
    </div>
  );
}

function Highlight({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gold/15 bg-card/40 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2 text-gold text-xs">
        {icon}
        <span className="uppercase tracking-widest text-[10px] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-1 font-display text-xl text-foreground">{value}</div>
    </div>
  );
}
