/**
 * Centralized affiliate configuration for MAB Flights.
 *
 * This file is the single source of truth for conversion partners.
 * When the Aviasales (or any other) affiliate program is activated,
 * only this file needs to change — `src/lib/affiliate.ts` reads from
 * here to build the outbound URL used by the "Continuar compra" CTA.
 *
 * Do NOT hardcode partner URLs in components. Import from here.
 */

export type AffiliatePartner = "google" | "aviasales" | "kiwi" | "skyscanner";

/**
 * Base URL of the Aviasales / Travelpayouts affiliate deep link.
 *
 * Expected format (example):
 *   https://tp.media/r?marker=XXXXXX&trs=YYYYY&p=ZZZZ&u=https%3A%2F%2Fwww.aviasales.com%2Fsearch
 *
 * The concrete value should come from a build-time env var
 * (VITE_AVIASALES_AFFILIATE_URL) so it can be swapped without code
 * changes once the partner account is approved.
 */
export const AVIASALES_AFFILIATE_URL: string =
  (import.meta.env.VITE_AVIASALES_AFFILIATE_URL as string | undefined) ?? "";

/**
 * Active partner used by `buildAffiliateUrl`.
 * Keep as "google" until Aviasales credentials are configured; then
 * switch to "aviasales" (or drive this from an env flag).
 */
export const ACTIVE_AFFILIATE_PARTNER: AffiliatePartner = "aviasales";

/**
 * Optional per-partner settings for future expansion.
 * Add marker/sub-id/campaign fields here as partners are onboarded.
 */
export const AFFILIATE_CONFIG = {
  aviasales: {
    baseUrl: AVIASALES_AFFILIATE_URL,
    // marker, sub_id, campaign_id, etc. — fill when account is live
  },
  google: {
    baseUrl: "https://www.google.com/travel/flights/",
  },
  kiwi: {
    baseUrl: "",
  },
  skyscanner: {
    baseUrl: "",
  },
} as const;
