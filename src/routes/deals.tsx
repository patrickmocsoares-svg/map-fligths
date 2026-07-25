import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DealCard } from "@/components/DealCard";
import { DEALS } from "@/lib/mock-data";
import { t } from "@/lib/i18n";

const schema = z.object({ tab: z.enum(["domestic", "international", "miles"]).optional() });

export const Route = createFileRoute("/deals")({
  validateSearch: (s) => schema.parse(s),
  head: () => ({
    meta: [
      { title: "Painel de Ofertas — MAB Flights" },
      { name: "description", content: "Todas as melhores ofertas de voos analisadas pelo MAB Score." },
      { property: "og:title", content: "Painel de Ofertas — MAB Flights" },
      { property: "og:description", content: "Ofertas nacionais, internacionais e achados com milhas." },
    ],
  }),
  component: Deals,
});

function Deals() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<"domestic" | "international" | "miles">(search.tab ?? "domestic");
  const items = DEALS.filter((d) => d.category === tab);

  const tabs = [
    { id: "domestic" as const, label: t("deals.domestic") },
    { id: "international" as const, label: t("deals.international") },
    { id: "miles" as const, label: t("deals.miles") },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <h1 className="font-display text-4xl md:text-5xl">Painel de Ofertas</h1>
        <p className="mt-2 text-sm text-muted-foreground">Curadoria em tempo real das melhores oportunidades identificadas pelo MAB Score.</p>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-gold/10 pb-2">
          {tabs.map((t2) => (
            <button
              key={t2.id}
              onClick={() => setTab(t2.id)}
              className={`rounded-t-lg px-4 py-2 text-sm transition ${
                tab === t2.id ? "text-gold border-b-2 border-gold -mb-[9px]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t2.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => <DealCard key={d.id} deal={d} />)}
        </div>
      </div>
      <Footer />
    </div>
  );
}
