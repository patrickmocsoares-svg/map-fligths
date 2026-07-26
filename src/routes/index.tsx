import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, MapPin } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DealCard } from "@/components/DealCard";
import { DEALS } from "@/lib/mock-data";
import { heroImage } from "@/lib/destination-images";
import { getDestination, destinationPhoto } from "@/lib/destinations";

const HERO_URL = heroImage(2400);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAB Flights — Transformando milhas em oportunidades" },
      {
        name: "description",
        content:
          "Plataforma premium de passagens: busque voos, monitore preços e descubra as melhores oportunidades curadas pelo MAB Score.",
      },
      { property: "og:title", content: "MAB Flights — Premium Travel Marketplace" },
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
  const featured = DEALS.filter((d) => d.category === "international").slice(0, 3);
  // Curated inspiration: unique destinations with rich editorial metadata.
  const inspireCodes = ["CDG", "FCO", "JFK", "DXB", "LIS", "MIA"] as const;
  const inspire = inspireCodes.map((code) => {
    const meta = getDestination(code);
    const deal = DEALS.find((d) => d.destination.code === code);
    return { meta, deal };
  });

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
          <div className="absolute inset-0 bg-background/40" />
        </div>

        <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 md:px-8 md:pb-16 md:pt-28">
          <div className="max-w-3xl animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/75 backdrop-blur">
              <Sparkles className="h-3 w-3 text-gold" /> Premium Travel Marketplace
            </div>
            <h1 className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.02] tracking-tight text-white text-balance sm:text-5xl md:text-7xl">
              Transformando <span className="font-serif font-normal text-gold-gradient">milhas</span>
              <br className="hidden sm:block" /> em <span className="font-serif font-normal">oportunidades.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/70 text-balance md:text-lg">
              Passagens curadas, preços monitorados em tempo real e o exclusivo MAB Score
              para revelar quando uma tarifa é realmente uma oportunidade.
            </p>
          </div>

          {/* Floating search card */}
          <div
            className="mx-auto mt-9 max-w-6xl animate-rise md:mt-14"
            style={{ animationDelay: "150ms" }}
          >
            <FlightSearchForm />
          </div>

          {/* Trust strip */}
          <div
            className="mx-auto mt-8 flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] uppercase tracking-[0.22em] text-white/55 animate-rise md:mt-12"
            style={{ animationDelay: "300ms" }}
          >
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-gold" /> MAB Score exclusivo</span>
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-gold" /> Preços monitorados 24/7</span>
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-gold" /> Curadoria editorial</span>
          </div>
        </div>
      </section>


      {/* ============================== FEATURED ============================== */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold">
              Curadoria da semana
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              Destinos que estão <span className="font-serif font-normal">valendo a viagem</span>.
            </h2>
          </div>
          <Link
            to="/deals"
            className="hidden shrink-0 items-center gap-2 text-sm font-medium text-gold hover:text-gold-soft md:inline-flex"
          >
            Ver todas as ofertas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((d, i) => (
            <div
              key={d.id}
              className="animate-rise"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <DealCard deal={d} />
            </div>
          ))}
        </div>

        <div className="mt-8 md:hidden">
          <Link
            to="/deals"
            className="inline-flex items-center gap-2 text-sm font-medium text-gold"
          >
            Ver todas as ofertas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ============================== INSPIRE ============================== */}
      <section className="border-t border-white/5 bg-background/60">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
          <div className="max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.28em] text-gold">
              Inspiração
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              Para onde a sua próxima <span className="font-serif font-normal">história</span> acontece?
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Uma seleção editorial de destinos com tarifas monitoradas — clique para explorar.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inspire.map(({ meta, deal }, i) => {
              const to = deal ? "/flight/$id" : "/search";
              return (
                <Link
                  key={meta.code}
                  to={to as "/search"}
                  {...(deal ? ({ params: { id: deal.id } } as unknown as object) : {})}
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

                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-white/85 backdrop-blur-md">
                    <MapPin className="h-3 w-3 text-gold" /> {meta.country}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-display text-2xl font-bold leading-tight text-white">
                      {meta.city}
                    </h3>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/75 line-clamp-2">
                      {meta.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
                      {deal ? "Ver oferta" : "Explorar destino"}
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
}
