/**
 * Commercial offer shelves (national + international).
 *
 * Prices come from the curated catalog and are ALWAYS labelled as indicative.
 * Every card has two real actions: search the route on the platform, or talk
 * to the team on WhatsApp with the full context already written.
 */
import { Link } from "@tanstack/react-router";
import { MessageCircle, Search, MapPin } from "lucide-react";
import { destinationPhoto } from "@/lib/destinations";
import { INDICATIVE_DISCLAIMER } from "@/lib/brand";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";
import { formatBRL } from "@/lib/i18n";
import {
  NATIONAL_OFFERS,
  INTERNATIONAL_OFFERS,
  rotateOffers,
  type CatalogOffer,
} from "@/lib/offers-catalog";

function OfferCard({ offer }: { offer: CatalogOffer }) {
  const { settings } = useSettings();
  const msg = [
    "Olá! Quero consultar uma oferta.",
    `Origem: ${offer.origin}`,
    `Destino: ${offer.city} (${offer.code})`,
    `Preço indicativo visto no site: ${formatBRL(offer.priceFrom)}`,
    "Podem me enviar as opções disponíveis (dinheiro ou milhas)?",
  ].join("\n");

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-40 overflow-hidden">
        <img
          src={destinationPhoto(offer.code)}
          alt={`${offer.city}, ${offer.country}`}
          loading="lazy"
          width={800}
          height={1000}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-brand/25" />
        <span className="absolute left-3 top-3 rounded-md bg-cta px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-cta-foreground">
          Preço indicativo
        </span>
        <div className="absolute bottom-3 left-3 text-brand-foreground">
          <div className="flex items-center gap-1 text-[11px] opacity-90">
            <MapPin className="h-3 w-3" /> {offer.country}
          </div>
          <div className="font-display text-lg font-bold leading-tight">{offer.city}</div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-end justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {offer.origin} → {offer.code} · a partir de
            </div>
            <div className="font-display text-2xl font-extrabold text-brand">
              {formatBRL(offer.priceFrom)}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          <a
            href={whatsappLink(msg, settings.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-whatsapp px-3 text-xs font-bold uppercase tracking-wide text-whatsapp-foreground transition hover:-translate-y-0.5"
          >
            <MessageCircle className="h-4 w-4" /> Conferir oferta
          </a>
          <Link
            to="/search"
            search={{ origin: offer.origin, destination: offer.code } as never}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand px-3 text-xs font-bold uppercase tracking-wide text-brand transition hover:bg-brand hover:text-brand-foreground"
          >
            <Search className="h-4 w-4" /> Buscar datas
          </Link>
        </div>
      </div>
    </article>
  );
}

function Shelf({
  id,
  eyebrow,
  title,
  subtitle,
  offers,
}: {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  offers: CatalogOffer[];
}) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-brand">{eyebrow}</p>
          <h2 className="mt-2 font-display text-2xl font-bold md:text-3xl">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          to="/deals"
          className="text-xs font-bold uppercase tracking-wider text-cta hover:underline"
        >
          Ver todas as ofertas
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {offers.map((o) => (
          <OfferCard key={`${o.scope}-${o.code}`} offer={o} />
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">{INDICATIVE_DISCLAIMER}</p>
    </section>
  );
}

export function NationalOffersSection({ count = 8 }: { count?: number }) {
  return (
    <Shelf
      id="ofertas-nacionais"
      eyebrow="Ofertas Nacionais"
      title="Voe pelo Brasil pagando menos"
      subtitle="Destinos mais procurados saindo dos principais aeroportos."
      offers={rotateOffers(NATIONAL_OFFERS, count)}
    />
  );
}

export function InternationalOffersSection({ count = 8 }: { count?: number }) {
  return (
    <div className="bg-secondary">
      <Shelf
        id="ofertas-internacionais"
        eyebrow="Ofertas Internacionais"
        title="O mundo ao alcance das suas milhas"
        subtitle="América do Sul, Estados Unidos, Europa e Oriente Médio."
        offers={rotateOffers(INTERNATIONAL_OFFERS, count)}
      />
    </div>
  );
}

/** Compact recovery grid used when a search returns nothing. */
export function RecoveryOffers({ scope = "national" }: { scope?: "national" | "international" }) {
  const list = scope === "international" ? INTERNATIONAL_OFFERS : NATIONAL_OFFERS;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {rotateOffers(list, 4).map((o) => (
        <OfferCard key={`rec-${o.code}`} offer={o} />
      ))}
    </div>
  );
}
