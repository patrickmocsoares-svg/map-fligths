import { useMemo, useState } from "react";
import { Flame, MessageCircle, RefreshCw, Timer } from "lucide-react";
import { DESTINATIONS, destinationPhoto, getDestination } from "@/lib/destinations";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";

/**
 * Rotating "promoções relâmpago" showcase.
 *
 * Images come from the destination catalog keyed by IATA code, so a card can
 * never show a photo of a different city. Prices are shown as an estimated
 * starting point ("a partir de") and always converted through WhatsApp.
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

const CODES = Object.keys(DESTINATIONS).filter((c) => !["CGH", "VCP", "SDU"].includes(c));

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

export function PromoDealsSection() {
  const { settings } = useSettings();
  const [round, setRound] = useState(0);

  const picks = useMemo(() => shuffle(CODES, round + 1).slice(0, 6), [round]);
  const headline = HEADLINES[round % HEADLINES.length];

  return (
    <section className="border-t border-white/5 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-8 md:py-28">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
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
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gold/25 px-4 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/10"
          >
            <RefreshCw className="h-4 w-4" /> Ver outras ofertas
          </button>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((code, i) => {
            const d = getDestination(code);
            const { price, was, discount } = priceFor(code, round);
            const urgency = URGENCY[(i + round) % URGENCY.length];
            const msg = `Olá! Vi a promoção para ${d.city} (${d.code}) a partir de R$ ${price.toLocaleString("pt-BR")}. Quero saber como economizar com milhas.`;
            return (
              <article
                key={code}
                className="group relative overflow-hidden rounded-3xl card-luxe animate-rise"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={destinationPhoto(code, 900, 700)}
                    alt={`${d.city}, ${d.country}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full bg-red-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg">
                    -{discount}%
                  </span>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/70">
                      {d.country}
                    </div>
                    <div className="font-display text-2xl font-bold text-white">{d.city}</div>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-sm text-muted-foreground">{d.experience}</p>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground line-through">
                        R$ {was.toLocaleString("pt-BR")}
                      </div>
                      <div className="font-display text-3xl font-extrabold leading-none text-gold">
                        R$ {price.toLocaleString("pt-BR")}
                      </div>
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        estimativa a partir de · por pessoa
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/70">
                      <Timer className="h-3 w-3 text-gold" /> {urgency}
                    </span>
                  </div>

                  <a
                    href={whatsappLink(msg, settings.whatsappNumber)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  >
                    <MessageCircle className="h-4 w-4" /> Quero economizar
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
