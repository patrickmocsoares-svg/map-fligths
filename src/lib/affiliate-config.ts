/**
 * Central affiliate registry for MAB Flights.
 *
 * Adding a new partner = add an entry to PARTNERS with its baseUrl,
 * priority, and enabled flag. `getActivePartner()` picks the best
 * available one (highest priority + enabled + baseUrl present).
 *
 * The Travelpayouts base URL MUST be preserved verbatim — only query
 * params are appended by the URL builder in `./affiliate.ts`.
 */

export type PartnerId = "aviasales" | "tripcom" | "booking" | "kiwi" | "skyscanner";

export type TrafficType = "deep-link" | "search" | "meta";

export type PartnerConfig = {
  id: PartnerId;
  name: string;
  baseUrl: string;
  enabled: boolean;
  priority: number; // higher wins
  trafficType: TrafficType;
  /** Optional marker/sub-id param name expected by the partner's tracking system. */
  subIdParam?: string;
  /** Optional marker param name for offer id. Default: mab_offer */
  offerMarkerParam?: string;
};

/**
 * Aviasales / Travelpayouts deep link. Loaded from env when present so
 * the marker/tracker can be swapped without a code change.
 */
const AVIASALES_URL: string =
  ((import.meta.env.VITE_AVIASALES_AFFILIATE_URL as string | undefined) ?? "").trim() ||
  "https://aviasales.tpx.lv/QpGgPtZO";

export const PARTNERS: PartnerConfig[] = [
  {
    id: "aviasales",
    name: "Aviasales",
    baseUrl: AVIASALES_URL,
    enabled: true,
    priority: 100,
    trafficType: "deep-link",
    subIdParam: "sub_id",
    offerMarkerParam: "mab_offer",
  },
  {
    id: "tripcom",
    name: "Trip.com",
    baseUrl: ((import.meta.env.VITE_TRIPCOM_AFFILIATE_URL as string | undefined) ?? "").trim(),
    enabled: false,
    priority: 80,
    trafficType: "deep-link",
    subIdParam: "sid",
    offerMarkerParam: "mab_offer",
  },
  {
    id: "booking",
    name: "Booking.com",
    baseUrl: ((import.meta.env.VITE_BOOKING_AFFILIATE_URL as string | undefined) ?? "").trim(),
    enabled: false,
    priority: 60,
    trafficType: "meta",
    subIdParam: "label",
    offerMarkerParam: "mab_offer",
  },
];

/**
 * Returns the highest-priority enabled partner that has a base URL configured.
 * Returns null if no partner is ready — the UI should then disable the CTA
 * instead of falling back to a non-affiliate destination.
 */
export function getActivePartner(): PartnerConfig | null {
  const candidates = PARTNERS.filter(
    (p) => p.enabled && p.baseUrl && p.baseUrl.trim().length > 0,
  ).sort((a, b) => b.priority - a.priority);
  return candidates[0] ?? null;
}

export function getPartnerById(id: PartnerId): PartnerConfig | undefined {
  return PARTNERS.find((p) => p.id === id);
}

/** Legacy exports (kept for backwards compatibility with older imports). */
export const AVIASALES_AFFILIATE_URL = AVIASALES_URL;
export const ACTIVE_AFFILIATE_PARTNER: PartnerId = "aviasales";
export const AFFILIATE_CONFIG = {
  aviasales: { baseUrl: AVIASALES_URL },
  tripcom: { baseUrl: "" },
  booking: { baseUrl: "" },
  kiwi: { baseUrl: "" },
  skyscanner: { baseUrl: "" },
} as const;
