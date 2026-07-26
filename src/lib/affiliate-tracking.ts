/**
 * Lightweight affiliate click tracking.
 *
 * Records outbound clicks locally (last 200) so we can measure conversion
 * intent even before a full analytics backend is wired up. Also emits a
 * `mab:affiliate_click` DOM event that any analytics adapter (GA4, Plausible,
 * PostHog, Segment) can listen to without coupling this module to a vendor.
 */
import type { FlightOffer, FlightSearchParams } from "@/lib/flights/types";
import type { PartnerConfig } from "@/lib/affiliate-config";

const STORAGE_KEY = "mab_affiliate_clicks";
const MAX_ENTRIES = 200;

export type AffiliateClickEvent = {
  ts: string;
  partner: string;
  offerId: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  cabin: string;
  url: string;
};

export function trackAffiliateClick(args: {
  partner: PartnerConfig;
  offer: FlightOffer;
  params: FlightSearchParams;
  url: string;
}): void {
  if (typeof window === "undefined") return;
  const evt: AffiliateClickEvent = {
    ts: new Date().toISOString(),
    partner: args.partner.id,
    offerId: args.offer.id,
    origin: args.params.origin,
    destination: args.params.destination,
    price: args.offer.price,
    currency: args.offer.currency,
    cabin: args.offer.cabin,
    url: args.url,
  };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const list: AffiliateClickEvent[] = raw ? JSON.parse(raw) : [];
    list.unshift(evt);
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_ENTRIES)),
    );
  } catch {
    // storage full / disabled — ignore
  }
  try {
    window.dispatchEvent(new CustomEvent("mab:affiliate_click", { detail: evt }));
  } catch {
    // no-op
  }
}

export function getAffiliateClicks(): AffiliateClickEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AffiliateClickEvent[]) : [];
  } catch {
    return [];
  }
}
