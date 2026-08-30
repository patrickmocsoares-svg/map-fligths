import { Link } from "@tanstack/react-router";
import { Plane, TrendingDown, Clock, ArrowRight } from "lucide-react";
import type { RealDeal } from "@/lib/deals/types";
import {
  computeMabScoreFromStats,
  scoreColorClass,
  scoreLabelKey,
} from "@/lib/mab-score";
import { formatBRL, t } from "@/lib/i18n";
import { destinationImage } from "@/lib/destination-images";

function fmtDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function DealCard({ deal }: { deal: RealDeal }) {
  const img = destinationImage(deal.destinationCode);
  const hasPrice = !deal.editorial && typeof deal.price === "number";
  const score =
    hasPrice && deal.avgPrice
      ? computeMabScoreFromStats({ price: deal.price!, avgPrice: deal.avgPrice })
      : null;
  const durH = deal.durationMin ? Math.floor(deal.durationMin / 60) : 0;
  const durM = deal.durationMin ? deal.durationMin % 60 : 0;

  const searchParams: Record<string, string | number> = {
    origin: deal.originCode,
    destination: deal.destinationCode,
  };
  if (deal.departDate) searchParams.depart = deal.departDate;
  if (deal.returnDate) searchParams.ret = deal.returnDate;

  return (
    <Link
      to="/search"
      search={searchParams as never}
      className="group block overflow-hidden rounded-3xl card-luxe card-hover"
    >
      {/* Cover */}
      <div className="relative aspect-[5/4] overflow-hidden">
        <img
          src={img}
          alt={deal.destinationCity}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.08]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/40" />

        {score && (
          <span
            className={`absolute top-4 left-4 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] backdrop-blur-md ${scoreColorClass(score.label)}`}
          >
            {t(scoreLabelKey(score.label))}
          </span>
        )}

        {score && score.discountPct > 0 && (
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-bold text-success backdrop-blur-md">
            <TrendingDown className="h-3 w-3" /> -{score.discountPct}%
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="text-[10px] font-medium uppercase tracking-[0.24em] text-white/60">
            {deal.destinationCountry || "\u00a0"}
          </div>
          <h3 className="mt-1 font-display text-2xl font-bold leading-tight text-white">
            {deal.destinationCity}
          </h3>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-white/75">
            <span className="font-mono tracking-wider">{deal.originCode}</span>
            <span className="h-px w-6 bg-brand/40" />
            <Plane className="h-3 w-3 text-brand" />
            <span className="h-px w-6 bg-brand/40" />
            <span className="font-mono tracking-wider">{deal.destinationCode}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        {hasPrice ? (
          <>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground/80">
                {deal.airlineCode ?? "Companhias diversas"}
              </span>
              {deal.durationMin ? (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {durH}h{durM.toString().padStart(2, "0")}
                  {typeof deal.stops === "number" &&
                    ` · ${deal.stops === 0 ? t("flight.direct") : `${deal.stops} ${deal.stops === 1 ? t("flight.stop") : t("flight.stops_plural")}`}`}
                </span>
              ) : null}
            </div>

            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  {t("misc.from")}
                </div>
                <div className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
                  {formatBRL(deal.price!)}
                </div>
                {deal.avgPrice && deal.avgPrice > deal.price! && (
                  <div className="mt-0.5 text-[11px] text-muted-foreground line-through">
                    {formatBRL(deal.avgPrice)}
                  </div>
                )}
                <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
                  Preço indicativo
                </div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                {(deal.departDate || deal.returnDate) && (
                  <div>
                    {fmtDate(deal.departDate)}
                    {deal.returnDate ? ` — ${fmtDate(deal.returnDate)}` : ""}
                  </div>
                )}
                {score && score.savings > 0 && (
                  <div className="mt-1 text-success">
                    Poupe {formatBRL(score.savings)}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Sem tarifas em cache no momento
              </div>
              <div className="mt-1 text-sm text-foreground/80">
                Buscar voos para {deal.destinationCity}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-brand transition-transform group-hover:translate-x-1" />
          </div>
        )}
      </div>
    </Link>
  );
}
