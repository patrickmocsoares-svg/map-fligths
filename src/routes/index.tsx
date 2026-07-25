import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MAB Flights — Busque voos premium com o MAB Score" },
      {
        name: "description",
        content:
          "Busca inteligente de voos: adultos, crianças e bebês, classe, ida e volta, multi-destinos e datas flexíveis em uma barra única.",
      },
      { property: "og:title", content: "MAB Flights — Transformando milhas em oportunidades" },
      {
        property: "og:description",
        content: "Busca de voos estilo Google Flights com o exclusivo MAB Score.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen">
      <Header />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.82_0.13_88/0.15),_transparent_60%)]" />
        </div>

        <div className="mx-auto max-w-6xl px-4 pt-16 pb-8 md:px-8 md:pt-24 md:pb-14">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-[10px] uppercase tracking-[0.25em] text-gold">
              <Sparkles className="h-3 w-3" /> Premium Travel Marketplace
            </div>
            <h1 className="mt-6 font-display text-4xl md:text-6xl leading-[1.05]">
              Transformando <span className="text-gold-gradient">milhas</span>
              <br />em oportunidades.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
              Uma única barra de busca — passageiros, classe, multi-destinos e datas flexíveis.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl">
            <FlightSearchForm />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
