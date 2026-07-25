/**
 * Affiliate link builder.
 *
 * The purchase flow is intentionally decoupled from any specific booking
 * partner. Today we emit a stub URL and log the intent; when an affiliate
 * program is wired up (Kiwi Tequila, Skyscanner Partners, WayAway, etc.)
 * only this file changes — the UI keeps calling `buildAffiliateUrl(offer)`.
 */
import type { FlightOffer, FlightSearchParams } from "@/lib/flights/types";

export type AffiliateContext = {
  offer: FlightOffer;
  params: FlightSearchParams;
};

export function buildAffiliateUrl(ctx: AffiliateContext): string {
  const { offer, params } = ctx;
  // Placeholder: deep-link to Google Flights results as a safe fallback.
  const q = new URLSearchParams({
    hl: "pt-BR",
    curr: params.currency ?? "BRL",
  });
  const path = `${params.origin}.${params.destination}.${params.departDate}${
    params.returnDate ? `*${params.destination}.${params.origin}.${params.returnDate}` : ""
  }`;
  return `https://www.google.com/travel/flights/${path}?${q.toString()}#mab-${offer.id}`;
}
