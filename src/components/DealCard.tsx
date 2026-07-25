import { Link } from "@tanstack/react-router";
import { Plane, TrendingDown, Sparkles, Clock } from "lucide-react";
import type { Deal } from "@/lib/mock-data";
import { computeMabScore, scoreColorClass, scoreLabelKey } from "@/lib/mab-score";
import { formatBRL, formatMiles, t } from "@/lib/i18n";
import { destinationImage } from "@/lib/destination-images";

function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function DealCard({ deal }: { deal: Deal }) {
  const score = computeMabScore(deal);
  const durH = Math.floor(deal.durationMin / 60);
  const durM = deal.durationMin % 60;
  const img = destinationImage(deal.destination.code);

  return (
    <Link
      to="/flight/$id"
      params={{ id: deal.id }}
      className="group block overflow-hidden rounded-3xl card-luxe transition-all duration-500 hover:-translate-y-1 hover:shadow-luxe hover:border-gold/25"
    >
      {/* Cover */}
      <div className="relative aspect-[5/4] overflow-hidden">
        <img
          src={img}
          alt={deal.destination.city}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

        {/* MAB Score badge */}
        <span
          className={`absolute top-4 left-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md ${scoreColorClass(score.label)}`}
        >
          {t(scoreLabelKey(score.label))}
        </span>

        {/* Savings pill */}
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-success backdrop-blur-md">
          <TrendingDown className="h-3 w-3" /> -{score.discountPct}%
        </span>

        {/* Bottom: city + route */}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/60">
            {deal.destination.country}
          </div>
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-white">
            {deal.destination.city}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-white/75">
            <span className="font-mono tracking-wider">{deal.origin.code}</span>
            <span className="h-px w-6 bg-gold/60" />
            <Plane className="h-3 w-3 text-gold" />
            <span className="h-px w-6 bg-gold/60" />
            <span className="font-mono tracking-wider">{deal.destination.code}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className="grid h-5 w-5 place-items-center rounded text-[9px] font-bold text-white"
              style={{ backgroundColor: deal.airline.color }}
            >
              {deal.airline.code}
            </span>
            <span className="font-medium text-foreground/80">{deal.airline.name}</span>
          </div>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {durH}h{durM.toString().padStart(2, "0")} ·{" "}
            {deal.stops === 0
              ? t("flight.direct")
              : `${deal.stops} ${deal.stops === 1 ? t("flight.stop") : t("flight.stops_plural")}`}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {t("misc.from")}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                {formatBRL(deal.priceBRL)}
              </span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground line-through">
              {formatBRL(deal.averagePriceBRL)}
            </div>
            {deal.miles && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold/25 bg-gold/5 px-2 py-0.5 text-[10px] text-gold-soft">
                <Sparkles className="h-2.5 w-2.5" /> {formatMiles(deal.miles)}{" "}
                {t("misc.miles")}
              </div>
            )}
          </div>
          <div className="text-right text-[10px] text-muted-foreground">
            <div>
              {fmtDate(deal.departDate)}
              {deal.returnDate ? ` — ${fmtDate(deal.returnDate)}` : ""}
            </div>
            <div className="mt-1 text-success">
              Poupe {formatBRL(score.savings)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
