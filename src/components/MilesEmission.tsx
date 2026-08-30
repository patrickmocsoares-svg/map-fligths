/**
 * Miles emission call-to-actions.
 *
 * Reused across the results list, the home search section and empty states.
 * Nothing here invents flights or availability — it only invites the visitor
 * to ask our team for a miles quote through WhatsApp.
 */
import { Gem, MessageCircle, Plane } from "lucide-react";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";
import { useT } from "@/lib/i18n";

export type MilesContext = {
  origin?: string;
  destination?: string;
  departDate?: string;
  returnDate?: string;
  passengers?: number;
  price?: number;
  currency?: string;
};

function fmtPrice(v?: number | null, currency = "BRL") {
  if (v == null) return "";
  return v.toLocaleString("pt-BR", { style: "currency", currency, maximumFractionDigits: 0 });
}

function useMilesLink(ctx: MilesContext) {
  const { settings } = useSettings();
  const lines = [
    "Olá! Quero consultar uma emissão com milhas.",
    ctx.origin ? `Origem: ${ctx.origin}` : null,
    ctx.destination ? `Destino: ${ctx.destination}` : null,
    ctx.departDate ? `Ida: ${ctx.departDate}` : null,
    ctx.returnDate ? `Volta: ${ctx.returnDate}` : null,
    ctx.passengers ? `Passageiros: ${ctx.passengers}` : null,
    ctx.price ? `Tarifa vista no site: ${fmtPrice(ctx.price, ctx.currency)}` : null,
    "Vi uma opção no MAB Flights e gostaria de saber se é possível emitir com milhas.",
  ].filter(Boolean);
  return whatsappLink(lines.join("\n"), settings.whatsappNumber);
}

const whatsBtn =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-whatsapp px-4 py-3 text-sm font-bold uppercase tracking-wide text-whatsapp-foreground transition-transform hover:-translate-y-0.5";

/** Compact block shown inside / below every flight offer. */
export function MilesOfferCTA({ ctx }: { ctx: MilesContext }) {
  const t = useT();
  const href = useMilesLink(ctx);
  const estimated = ctx.price ? Math.round(ctx.price * 0.6) : null;

  return (
    <div className="rounded-2xl border border-border bg-cta/[0.06] p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
        <Plane className="h-3.5 w-3.5" /> {t("miles.cta.title")}
      </div>
      <p className="mt-1.5 text-sm text-foreground">{t("miles.cta.text")}</p>
      <p className="mt-1 text-xs text-muted-foreground">{t("miles.cta.sub")}</p>
      {estimated != null && (
        <p className="mt-2 text-sm text-foreground">
          <span className="text-muted-foreground">{t("miles.cta.from")} </span>
          <strong className="text-brand">{fmtPrice(estimated, ctx.currency)}*</strong>
        </p>
      )}
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${whatsBtn} mt-3`}>
        <MessageCircle className="h-4 w-4" /> {t("miles.cta.button")}
      </a>
      <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{t("miles.disclaimer")}</p>
    </div>
  );
}

/** Reference price block — used when there is no confirmed fare for the search. */
export function MilesReferencePrice({ ctx }: { ctx: MilesContext }) {
  const t = useT();
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {t("miles.reference.title")}
      </div>
      <div className="mt-1 font-display text-4xl font-extrabold text-brand">
        {fmtPrice(ctx.price, ctx.currency)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{t("miles.reference.note")}</p>
      <div className="mt-4">
        <MilesOfferCTA ctx={ctx} />
      </div>
    </div>
  );
}

/** Shown when the API returns nothing at all. */
export function MilesNoResults({ ctx }: { ctx: MilesContext }) {
  const t = useT();
  const href = useMilesLink(ctx);
  return (
    <div className="rounded-3xl border border-border bg-cta/[0.06] p-6">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
        <Plane className="h-3.5 w-3.5" /> {t("miles.none.title")}
      </div>
      <p className="mt-2 text-sm text-foreground">{t("miles.none.text")}</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${whatsBtn} mt-4 md:max-w-sm`}>
        <MessageCircle className="h-4 w-4" /> {t("miles.none.button")}
      </a>
    </div>
  );
}

/** Editorial commercial banner for the results page. */
export function MilesBanner({ ctx }: { ctx: MilesContext }) {
  const t = useT();
  const href = useMilesLink(ctx);
  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card/70 p-6 md:p-8">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand">
        <Gem className="h-3.5 w-3.5" /> {t("miles.banner.title")}
      </div>
      <h3 className="mt-3 font-display text-2xl font-bold leading-tight md:text-3xl">
        {t("miles.banner.headline")}
      </h3>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{t("miles.banner.text")}</p>
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${whatsBtn} mt-5 md:max-w-xs`}>
        <MessageCircle className="h-4 w-4" /> {t("miles.banner.button")}
      </a>
    </section>
  );
}
