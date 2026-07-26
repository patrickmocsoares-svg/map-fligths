/**
 * Centralized affiliate configuration for MAB Flights.
 *
 * Single source of truth for conversion partners. To onboard a new partner
 * (Trip.com, Booking, Kiwi, etc.), add an entry to `PARTNERS` and — when
 * ready — bump its `priority` above the current active partner. The
 * "Continuar compra" CTA reads from this file via `src/lib/affiliate.ts`.
 *
 * Do NOT hardcode partner URLs in components.
 */

export type AffiliatePartner =
  | "aviasales"
  | "tripcom"
  | "booking"
  | "kiwi"
  | "skyscanner";

export type PartnerConfig = {
  id: AffiliatePartner;
  /** Human-readable partner name, shown in tooltips / analytics. */
  name: string;
  /** Deep-link base URL. Empty string = not configured. */
  baseUrl: string;
  /** Higher = preferred. Only partners with a non-empty baseUrl are eligible. */
  priority: number;
  /** Optional query param used to tag the outbound offer id for attribution. */
  markerParam?: string;
};

const AVIASALES_URL =
  (import.meta.env.VITE_AVIASALES_AFFILIATE_URL as string | undefined) ?? "";
const TRIPCOM_URL =
  (import.meta.env.VITE_TRIPCOM_AFFILIATE_URL as string | undefined) ?? "";
const BOOKING_URL =
  (import.meta.env.VITE_BOOKING_AFFILIATE_URL as string | undefined) ?? "";
const KIWI_URL =
  (import.meta.env.VITE_KIWI_AFFILIATE_URL as string | undefined) ?? "";
const SKYSCANNER_URL =
  (import.meta.env.VITE_SKYSCANNER_AFFILIATE_URL as string | undefined) ?? "";

/**
 * Registry of known partners. Order does not matter — `priority` decides.
 * Aviasales / Travelpayouts is currently the only live conversion partner.
 */
export const PARTNERS: Record<AffiliatePartner, PartnerConfig> = {
  aviasales: {
    id: "aviasales",
    name: "Aviasales",
    baseUrl: AVIASALES_URL,
    priority: 100,
    markerParam: "mab_offer",
  },
  tripcom: {
    id: "tripcom",
    name: "Trip.com",
    baseUrl: TRIPCOM_URL,
    priority: 80,
    markerParam: "mab_offer",
  },
  booking: {
    id: "booking",
    name: "Booking.com",
    baseUrl: BOOKING_URL,
    priority: 70,
    markerParam: "aid",
  },
  kiwi: {
    id: "kiwi",
    name: "Kiwi.com",
    baseUrl: KIWI_URL,
    priority: 60,
    markerParam: "mab_offer",
  },
  skyscanner: {
    id: "skyscanner",
    name: "Skyscanner",
    baseUrl: SKYSCANNER_URL,
    priority: 50,
    markerParam: "associateid",
  },
};

/**
 * Optional forced partner override. Leave as `null` to auto-select the
 * highest-priority partner with a configured baseUrl.
 */
export const ACTIVE_AFFILIATE_PARTNER: AffiliatePartner | null = null;

/**
 * Back-compat: previous versions exposed these two constants directly.
 * Kept so external references keep compiling; new code should use PARTNERS.
 */
export const AVIASALES_AFFILIATE_URL = AVIASALES_URL;
export const AFFILIATE_CONFIG = PARTNERS;
