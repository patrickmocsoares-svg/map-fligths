import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlightSearchForm } from "@/components/FlightSearchForm";
import { DEALS } from "@/lib/mock-data";
import { computeMabScore, scoreColorClass, scoreLabelKey } from "@/lib/mab-score";
import { formatBRL, t } from "@/lib/i18n";
import { Plane, ChevronRight } from "lucide-react";

const searchSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  depart: z.string().optional(),
  ret: z.string().optional(),
  pax: z.number().optional(),
  cabin: z.string().optional(),
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
});

type Sort = "price" | "score" | "duration";

function SearchResults() {
  const params = Route.useSearch();
  const [sort, setSort] = useState<Sort>("score");

  const results = useMemo(() => {
    let list = DEALS.slice();
    if (params.origin) list = list.filter((d) => d.origin.code === params.origin);
    if (params.destination) list = list.filter((d) => d.destination.code === params.destination);
    if (list.length === 0) list = DEALS.slice(0, 6);

    if (sort === "price") list.sort((a, b) => a.priceBRL - b.priceBRL);
    else if (sort === "duration") list.sort((a, b) => a.durationMin - b.durationMin);
    else list.sort((a, b) => computeMabScore(b).score - computeMabScore(a).score);
    return list;
  }, [params.origin, params.destination, sort]);

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
              {results.length} {t("results.found")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">{t("results.sort")}</span>
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

        <div className="space-y-3 pb-16">
          {results.map((d) => {
            const s = computeMabScore(d);
            const dh = Math.floor(d.durationMin / 60);
            const dm = d.durationMin % 60;
            return (
              <Link
                key={d.id}
                to="/flight/$id"
                params={{ id: d.id }}
                className="grid md:grid-cols-[auto_1fr_auto_auto] items-center gap-4 md:gap-6 rounded-xl card-luxe p-4 md:p-5 hover:border-gold/40 transition"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-lg text-xs font-bold text-white"
                    style={{ backgroundColor: d.airline.color }}
                  >
                    {d.airline.code}
                  </span>
                  <div className="text-xs">
                    <div className="font-medium">{d.airline.name}</div>
                    <div className="text-muted-foreground">{d.stops === 0 ? t("flight.direct") : `${d.stops} ${t("flight.stop")}`}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-center min-w-14">
                    <div className="font-display text-xl">{d.origin.code}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.origin.city}</div>
                  </div>
                  <div className="flex-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-gold/20" />
                    <Plane className="h-3 w-3 text-gold" />
                    <span>{dh}h{dm.toString().padStart(2, "0")}</span>
                    <span className="h-px flex-1 bg-gold/20" />
                  </div>
                  <div className="text-center min-w-14">
                    <div className="font-display text-xl">{d.destination.code}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{d.destination.city}</div>
                  </div>
                </div>

                <span className={`justify-self-start md:justify-self-auto rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${scoreColorClass(s.label)}`}>
                  {t(scoreLabelKey(s.label))} · {s.score}
                </span>

                <div className="flex items-center justify-between md:justify-end gap-3">
                  <div className="text-right">
                    <div className="font-display text-2xl text-gold-gradient">{formatBRL(d.priceBRL)}</div>
                    <div className="text-[10px] text-success">-{s.discountPct}% vs média</div>
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
