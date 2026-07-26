/**
 * Affiliate click tracking — thin, dependency-free layer.
 *
 * - Buffers events in localStorage (last 100) for debugging / future
 *   server flush.
 * - Emits to `window.dataLayer` (GTM) and `window.gtag` (GA4) when
 *   available. Fails silently otherwise.
 * - `flushToServer` is a stub kept for future Supabase integration.
 */
import type { FlightOffer, FlightSearchParams } from "@/lib/flights/types";
import type { PartnerConfig } from "@/lib/affiliate-config";

export type AffiliateClickEvent = {
  ts: string;
  partnerId: string;
  partnerName: string;
  offerId: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  cabin: string;
  passengers: number;
  price: number;
  currency: string;
  subId: string;
};

const STORAGE_KEY = "mab:affiliate-clicks";
const MAX_BUFFER = 100;

export function trackAffiliateClick(input: {
  partner: PartnerConfig;
  offer: FlightOffer;
  params: FlightSearchParams;
  subId: string;
}): AffiliateClickEvent {
  const evt: AffiliateClickEvent = {
    ts: new Date().toISOString(),
    partnerId: input.partner.id,
    partnerName: input.partner.name,
    offerId: input.offer.id,
    origin: input.params.origin,
    destination: input.params.destination,
    departDate: input.params.departDate,
    returnDate: input.params.returnDate,
    cabin: input.params.cabin ?? "economy",
    passengers: input.params.passengers ?? 1,
    price: input.offer.price,
    currency: input.offer.currency,
    subId: input.subId,
  };

  if (typeof window === "undefined") return evt;

  // Buffer to localStorage (best-effort).
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const arr: AffiliateClickEvent[] = raw ? JSON.parse(raw) : [];
    arr.unshift(evt);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr.slice(0, MAX_BUFFER)));
  } catch {
    /* storage disabled / quota — ignore */
  }

  // GTM dataLayer.
  try {
    const w = window as unknown as { dataLayer?: unknown[] };
    if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({ event: "affiliate_click", ...evt });
    }
  } catch {
    /* ignore */
  }

  // GA4 gtag.
  try {
    const w = window as unknown as {
      gtag?: (cmd: string, name: string, params: Record<string, unknown>) => void;
    };
    if (typeof w.gtag === "function") {
      w.gtag("event", "affiliate_click", {
        partner_id: evt.partnerId,
        offer_id: evt.offerId,
        value: evt.price,
        currency: evt.currency,
        origin: evt.origin,
        destination: evt.destination,
      });
    }
  } catch {
    /* ignore */
  }

  return evt;
}

export function readAffiliateClicks(): AffiliateClickEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AffiliateClickEvent[]) : [];
  } catch {
    return [];
  }
}

/** Stub for future server-side persistence (e.g. Supabase edge insert). */
export async function flushToServer(): Promise<void> {
  // Intentionally empty. Wire to a server function when analytics table exists.
}
