import { Link } from "@tanstack/react-router";
import { Plane, TrendingDown, Sparkles } from "lucide-react";
import type { Deal } from "@/lib/mock-data";
import { computeMabScore, scoreColorClass, scoreLabelKey } from "@/lib/mab-score";
import { formatBRL, formatMiles, t } from "@/lib/i18n";

export function DealCard({ deal }: { deal: Deal }) {
  const score = computeMabScore(deal);
  const durH = Math.floor(deal.durationMin / 60);
  const durM = deal.durationMin % 60;

  return (
    <Link
      to="/flight/$id"
      params={{ id: deal.id }}
      className="group block rounded-2xl card-luxe p-5 transition hover:border-gold/40 hover:-translate-y-0.5 hover:shadow-luxe"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: deal.airline.color }}
          >
            {deal.airline.code}
          </span>
          <div className="text-xs">
            <div className="font-medium text-foreground">{deal.airline.name}</div>
            <div className="text-muted-foreground">
              {deal.stops === 0 ? t("flight.direct") : `${deal.stops} ${deal.stops === 1 ? t("flight.stop") : t("flight.stops_plural")}`} · {durH}h{durM.toString().padStart(2, "0")}
            </div>
          </div>
        </div>

        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${scoreColorClass(score.label)}`}>
          {t(scoreLabelKey(score.label))}
        </span>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="text-center">
          <div className="font-display text-2xl leading-none text-foreground">{deal.origin.code}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{deal.origin.city}</div>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <Plane className="h-3.5 w-3.5 text-gold" />
          <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>
        <div className="text-center">
          <div className="font-display text-2xl leading-none text-foreground">{deal.destination.code}</div>
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">{deal.destination.city}</div>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("misc.from")}</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="font-display text-3xl text-gold-gradient">{formatBRL(deal.priceBRL)}</span>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground line-through">{formatBRL(deal.averagePriceBRL)}</div>
          {deal.miles && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gold-soft">
              <Sparkles className="h-3 w-3" /> {formatMiles(deal.miles)} {t("misc.miles")}
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="inline-flex items-center gap-1 rounded-md bg-success/15 text-success px-2 py-1 text-xs font-semibold">
            <TrendingDown className="h-3 w-3" />
            -{score.discountPct}%
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">
            {t("deal.savings")}: <span className="text-foreground/80">{formatBRL(score.savings)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
