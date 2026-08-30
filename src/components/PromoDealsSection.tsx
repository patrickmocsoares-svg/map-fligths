import { useMemo, useState } from "react";
import { Flame, MessageCircle, Plane, RefreshCw, Timer, X } from "lucide-react";
import { DESTINATIONS, destinationPhoto, getDestination } from "@/lib/destinations";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";
import { isDomesticPromo, promoOffers } from "@/lib/promo-flights";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Rotating "promoções relâmpago" showcase.
 *
 * Images come from the destination catalog keyed by IATA code, so a card can
 * never show a photo of a different city. Clicking a card opens the estimated
 * fares for that route — Brazilian carriers on domestic routes, region-valid
 * international carriers otherwise. Every price is an estimate and always
 * converts through WhatsApp.
 */

const HEADLINES = [
  "Sua próxima viagem pode custar metade do que você imagina.",
  "Quem viaja com milhas paga menos. Sempre.",
  "Tarifa boa dura pouco — garanta a sua agora.",
];

const URGENCY = [
  "Últimos assentos nesta tarifa",
  "Oferta válida enquanto durar o estoque",
  "Encontrada há poucos minutos",
  "Alta procura nas últimas 24h",
];

const ORIGIN = "GRU";

const ALL_CODES = Object.keys(DESTINATIONS).filter((c) => !["CGH", "VCP", "SDU", ORIGIN].includes(c));
const DOMESTIC_CODES = ALL_CODES.filter((c) => isDomesticPromo(c));
const INTL_CODES = ALL_CODES.filter((c) => !isDomesticPromo(c));

type Filter = "todos" | "nacionais" | "internacionais";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todas as ofertas" },
  { key: "nacionais", label: "Brasil" },
  { key: "internacionais", label: "Internacionais" },
];

function priceFor(code: string, salt: number) {
  const d = getDestination(code);
  let h = 2166136261 ^ salt;
  for (const ch of code) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const r = ((h >>> 0) % 1000) / 1000;
  const base = d.region === "Brasil" ? 320 : d.region === "América Latina" ? 980 : 2290;
  const price = Math.round((base * (0.85 + r * 0.5)) / 10) * 10;
  const discount = 18 + Math.floor(r * 30);
  return { price, discount, was: Math.round((price / (1 - discount / 100)) / 10) * 10 };
}

function shuffle<T>(arr: T[], salt: number): T[] {
  return [...arr]
    .map((v, i) => ({ v, k: Math.sin((i + 1) * (salt + 7)) }))
    .sort((a, b) => a.k - b.k)
    .map((o) => o.v);
}

const brl = (n: number) => `R$ ${n.toLocaleString("pt-BR")}`;

export function PromoDealsSection() {
  const { settings } = useSettings();
  const [round, setRound] = useState(0);
  const [filter, setFilter] = useState<Filter>("todos");
  const [openCode, setOpenCode] = useState<string | null>(null);

  const pool =
    filter === "nacionais" ? DOMESTIC_CODES : filter === "internacionais" ? INTL_CODES : ALL_CODES;

  const picks = useMemo(() => {
    if (filter === "todos") {
      return [
        ...shuffle(DOMESTIC_CODES, round + 11).slice(0, 3),
        ...shuffle(INTL_CODES, round + 29).slice(0, 3),
      ].sort((a, b) => Math.sin(a.charCodeAt(0) + round) - Math.sin(b.charCodeAt(0) + round));
    }
    return shuffle(pool, round + 1 + filter.length).slice(0, 6);
  }, [pool, round, filter]);
  const headline = HEADLINES[round % HEADLINES.length];

  const selected = openCode ? getDestination(openCode) : null;
  const selectedPrice = openCode ? priceFor(openCode, round) : null;
  const offers = useMemo(
    () => (openCode ? promoOffers(openCode, priceFor(openCode, round).price, round) : []),
    [openCode, round],
  );

  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cta/40 bg-cta/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-cta">
              <Flame className="h-3 w-3" /> Promoções relâmpago
            </div>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight md:text-5xl">
              {headline}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Valores estimados a partir de, por pessoa. Fechamos o preço final com você no
              WhatsApp — em dinheiro ou com milhas.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRound((r) => r + 1)}
            className="btn-brand shrink-0 text-sm"
          >
            <RefreshCw className="h-4 w-4" /> Ver outras ofertas
          </button>
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${
                filter === f.key
                  ? "bg-cta text-cta-foreground"
                  : "border border-border text-muted-foreground hover:border-brand hover:text-brand"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((code, i) => {
            const d = getDestination(code);
            const { price, was, discount } = priceFor(code, round);
            const urgency = URGENCY[(i + round) % URGENCY.length];
            const msg = `Olá! Vi a promoção para ${d.city} (${d.code}) a partir de ${brl(price)}. Quero saber como economizar com milhas.`;
            return (
              <article
                key={code}
                className="group relative overflow-hidden rounded-3xl card-luxe animate-rise"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenCode(code)}
                  aria-label={`Ver voos estimados para ${d.city}`}
                  className="block w-full text-left"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={destinationPhoto(code, 900, 700)}
                      alt={`${d.city}, ${d.country}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand/95 via-brand/30 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-lg bg-cta px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cta-foreground shadow-lg">
                      -{discount}%
                    </span>
                    <span className="absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand backdrop-blur">
                      {isDomesticPromo(code) ? "Nacional" : "Internacional"}
                    </span>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-xs uppercase tracking-[0.22em] text-white/70">
                        {d.country}
                      </div>
                      <div className="font-display text-2xl font-bold text-white">{d.city}</div>
                    </div>
                  </div>
                </button>

                <div className="p-5">
                  <p className="text-sm text-muted-foreground">{d.experience}</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground line-through">{brl(was)}</div>
                      <div className="font-display text-3xl font-extrabold leading-none text-brand">
                        {brl(price)}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        estimativa a partir de · por pessoa
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                      <Timer className="h-3 w-3 text-cta" /> {urgency}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOpenCode(code)}
                    className="btn-brand mt-4 w-full px-4 py-2.5 text-xs uppercase tracking-[0.16em]"
                  >
                    <Plane className="h-4 w-4" /> Ver voos desta promoção
                  </button>

                  <a
                    href={whatsappLink(msg, settings.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-3 text-sm font-bold text-whatsapp-foreground transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="h-4 w-4" /> QUERO ECONOMIZAR
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <Dialog open={!!openCode} onOpenChange={(o) => !o && setOpenCode(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {selected && selectedPrice && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">
                  {ORIGIN} → {selected.city} ({selected.code})
                </DialogTitle>
                <DialogDescription>
                  {isDomesticPromo(selected.code)
                    ? "Voos nacionais operados por LATAM, GOL e Azul."
                    : `Companhias que operam para ${selected.country}.`}{" "}
                  Valores estimados — confirmamos a tarifa final no WhatsApp.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                {offers.map((o) => {
                  const msg = `Olá! Vi a promoção ${ORIGIN} → ${selected.city} (${selected.code}) com ${o.airlineName}, saindo ${o.depart}, por cerca de ${brl(o.price)}. Quero economizar com milhas.`;
                  return (
                    <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold">{o.airlineName}</div>
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                            {o.flightNumber} · {o.cabin}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-2xl font-extrabold leading-none text-brand">
                            {brl(o.price)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">estimativa</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{o.depart}</span>
                        <span className="h-px flex-1 bg-muted" />
                        <span className="text-[11px] uppercase tracking-wide">
                          {o.durationLabel} ·{" "}
                          {o.stops === 0 ? "direto" : `${o.stops} parada${o.stops > 1 ? "s" : ""}`}
                        </span>
                        <span className="h-px flex-1 bg-muted" />
                        <span className="font-medium text-foreground">{o.arrive}</span>
                      </div>
                      <a
                        href={whatsappLink(msg, settings.whatsappNumber)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-bold text-whatsapp-foreground transition-transform hover:-translate-y-0.5"
                      >
                        <MessageCircle className="h-4 w-4" /> QUERO ECONOMIZAR
                      </a>
                    </div>
                  );
                })}
              </div>

              <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                <X className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                Estes valores são estimativas para iniciar a cotação. A tarifa final (em dinheiro ou
                milhas) é confirmada pela nossa equipe antes de qualquer emissão.
              </p>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
