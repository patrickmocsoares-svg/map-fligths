/**
 * Affiliate link builder.
 *
 * Reads the active partner from `src/lib/affiliate-config.ts` and builds
 * the outbound URL for the "Continuar compra" CTA. When the active partner
 * is Aviasales and `VITE_AVIASALES_AFFILIATE_URL` is configured, the user
 * is redirected through the affiliate deep link. Otherwise we fall back to
 * a safe Google Flights search URL so the flow never breaks.
 */
import type { FlightOffer, FlightSearchParams } from "@/lib/flights/types";
import {
  ACTIVE_AFFILIATE_PARTNER,
  AFFILIATE_CONFIG,
} from "@/lib/affiliate-config";

export type AffiliateContext = {
  offer: FlightOffer;
  params: FlightSearchParams;
};

function buildGoogleFlightsUrl(ctx: AffiliateContext): string {
  const { offer, params } = ctx;
  const q = new URLSearchParams({
    hl: "pt-BR",
    curr: params.currency ?? "BRL",
  });
  const path = `${params.origin}.${params.destination}.${params.departDate}${
    params.returnDate ? `*${params.destination}.${params.origin}.${params.returnDate}` : ""
  }`;
  return `https://www.google.com/travel/flights/${path}?${q.toString()}#mab-${offer.id}`;
}

function appendMabMarker(url: string, offerId: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("mab_offer", offerId);
    return u.toString();
  } catch {
    return url;
  }
}

export function buildAffiliateUrl(ctx: AffiliateContext): string {
  const partner = ACTIVE_AFFILIATE_PARTNER;

  if (partner === "aviasales") {
    const base = AFFILIATE_CONFIG.aviasales.baseUrl;
    if (base && base.trim().length > 0) {
      return appendMabMarker(base, ctx.offer.id);
    }
    // Missing env — safe fallback so the CTA still works.
    return buildGoogleFlightsUrl(ctx);
  }

  // Default / google / partners without a configured base URL.
  return buildGoogleFlightsUrl(ctx);
}
