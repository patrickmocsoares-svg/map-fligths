import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Sparkles, MapPin, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import { RealFlightSearchSection } from "@/components/RealFlightSearchSection";
import { PromoDealsSection } from "@/components/PromoDealsSection";
import { PlatformSection } from "@/components/PlatformSection";
import {
  NationalOffersSection,
  InternationalOffersSection,
  RecoveryOffers,
} from "@/components/OffersSections";
import { getCuratedDealsFn } from "@/lib/deals/travelpayouts-deals.functions";
import type { RealDeal } from "@/lib/deals/types";
import { heroImage } from "@/lib/destination-images";
import { getDestination, destinationPhoto } from "@/lib/destinations";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/lib/i18n";

const HERO_URL = heroImage(2400);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TRIPmoc — Transformando milhas em oportunidades" },
      {
        name: "description",
        content:
          "Plataforma premium de passagens: busque voos, monitore preços e descubra as melhores oportunidades curadas pelo MAB Score.",
      },
      { property: "og:title", content: "TRIPmoc — Premium Travel Marketplace" },
      {
        property: "og:description",
        content: "Busque voos, descubra oportunidades e viaje melhor. Curadoria premium pelo MAB Score.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: HERO_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: HERO_URL },
    ],
  }),
  component: Home,
});

function Home() {
  const t = useT();
  const { settings } = useSettings();
  const heroMilesLink = whatsappLink(
    "Olá! Quero consultar uma emissão com milhas para a minha próxima viagem.",
    settings.whatsappNumber,
  );
  const fetchCurated = useServerFn(getCuratedDealsFn);
  const curated = useQuery({
    queryKey: ["curated-deals", "GRU"],
    queryFn: () => fetchCurated({ data: { origin: "GRU", limit: 40 } }),
    staleTime: 5 * 60 * 1000,
  });

  const featured: RealDeal[] = (curated.data ?? [])
    .filter((d) => d.category === "international")
    .slice(0, 3);

  // Editorial destinations — never carry prices.
  const inspireCodes = ["CDG", "FCO", "JFK", "DXB", "LIS", "MIA"] as const;
  const inspire = inspireCodes.map((code) => getDestination(code));

  return (
    <div className="min-h-screen">
      <Header />

      {/* ============================== HERO ============================== */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img
            src={HERO_URL}
            alt=""
            aria-hidden
            className="h-full w-full object-cover animate-kenburns"
          />
          <div className="absolute inset-0 hero-overlay" />
          <div className="absolute inset-0 bg-brand/35" />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 md:px-8 md:pb-16 md:pt-28">
          <div className="max-w-3xl animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-brand/50 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/85 backdrop-blur">
              <Sparkles className="h-3 w-3 text-cta" /> Premium Travel Marketplace
            </div>
            <h1 className="mt-6 font-display text-[2.15rem] font-extrabold leading-[1.08] tracking-tight text-white text-balance sm:text-5xl md:text-6xl">
              Viaje de Executiva ou Econômica pagando até 60% menos{" "}
              <span className="text-mabgold">que a tarifa convencional</span>
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/85 text-balance md:text-lg">
              Aqui você encontra formas inteligentes de reduzir o custo da passagem
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:max-w-sm">
              <Link
                to="/solicitar"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-cta px-7 py-4 text-sm font-bold uppercase tracking-wide text-cta-foreground shadow-[0_4px_12px_rgba(255,107,53,0.4)] transition-all hover:-translate-y-0.5 hover:bg-cta-hover"
              >
                Solicitar cotação <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={heroMilesLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-4 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <MessageCircle className="h-4 w-4" /> Emissão Direta com Milhas
              </a>
            </div>
          </div>

          <div className="mx-auto mt-9 max-w-6xl animate-rise md:mt-14" style={{ animationDelay: "150ms" }}>
            <FlightSearchForm />
            <p className="mt-4 text-center text-[12px] font-medium text-white/75">
              Líder em emissões premium. +15.000 clientes satisfeitos.
            </p>
          </div>

          <div
            className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.22em] text-white/55 animate-rise md:mt-12"
            style={{ animationDelay: "300ms" }}
          >
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-cta" /> MAB Score exclusivo</span>
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-cta" /> Preços monitorados 24/7</span>
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-cta" /> Curadoria editorial</span>
          </div>
        </div>
      </section>


      {/* ============================== FEATURED ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-brand-soft">
              Curadoria da semana
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              Destinos que estão <span className="font-serif font-normal">valendo a viagem</span>.
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Preços indicativos capturados em tempo real via nossos parceiros. Confirmação no checkout.
            </p>
          </div>
          <Link
            to="/deals"
            className="hidden shrink-0 items-center gap-2 text-sm font-medium text-brand-soft hover:text-brand md:inline-flex"
          >
            Ver todas as ofertas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {curated.isLoading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[5/4] animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((d, i) => (
              <div key={d.id} className="animate-rise" style={{ animationDelay: `${i * 80}ms` }}>
                <DealCard deal={d} />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10">
            <p className="mb-5 text-sm text-muted-foreground">
              Sem tarifa em tempo real neste momento — veja oportunidades com preço indicativo e
              fale com um consultor.
            </p>
            <RecoveryOffers scope="international" />
          </div>
        )}

        <div className="mt-8 md:hidden">
          <Link to="/deals" className="inline-flex items-center gap-2 text-sm font-medium text-brand-soft">
            Ver todas as ofertas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ============================== INSPIRE ============================== */}
      <section id="destinos" className="border-t border-border bg-secondary scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.28em] text-brand-soft">
              Inspiração
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              Para onde a sua próxima <span className="font-serif font-normal">história</span> acontece?
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Uma seleção editorial de destinos — clique para explorar tarifas monitoradas.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inspire.map((meta, i) => (
              <Link
                key={meta.code}
                to="/search"
                search={{ origin: "GRU", destination: meta.code } as never}
                className="group relative block aspect-[4/5] overflow-hidden rounded-3xl card-luxe animate-rise"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <img
                  src={destinationPhoto(meta.code, 800, 1000)}
                  alt={`${meta.city}, ${meta.country}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.08]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-brand/60 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                  <MapPin className="h-3 w-3 text-cta" /> {meta.country}
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-2xl font-bold leading-tight text-white">
                    {meta.city}
                  </h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/75 line-clamp-2">
                    {meta.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-cta">
                    Explorar destino
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <NationalOffersSection />
      <InternationalOffersSection />
      <PromoDealsSection />
      <RealFlightSearchSection />
      <PlatformSection />

      <Footer />
    </div>
  );
}
