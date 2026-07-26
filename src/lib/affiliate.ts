/**
 * Affiliate link builder + partner selection.
 *
 * Chooses the best available partner from `PARTNERS` (highest `priority`
 * with a non-empty baseUrl) unless `ACTIVE_AFFILIATE_PARTNER` forces one.
 * Returns `null` when no partner is configured so the UI can disable the
 * CTA instead of silently redirecting to a third party (no more Google
 * Flights fallback).
 */
import type { FlightOffer, FlightSearchParams } from "@/lib/flights/types";
import {
  ACTIVE_AFFILIATE_PARTNER,
  PARTNERS,
  type AffiliatePartner,
  type PartnerConfig,
} from "@/lib/affiliate-config";

export type AffiliateContext = {
  offer: FlightOffer;
  params: FlightSearchParams;
};

export type AffiliateResolution = {
  partner: PartnerConfig;
  url: string;
};

function isEligible(p: PartnerConfig): boolean {
  return typeof p.baseUrl === "string" && p.baseUrl.trim().length > 0;
}

/** Resolve the partner that should receive this click, or `null`. */
export function resolveAffiliatePartner(): PartnerConfig | null {
  if (ACTIVE_AFFILIATE_PARTNER) {
    const forced = PARTNERS[ACTIVE_AFFILIATE_PARTNER as AffiliatePartner];
    return forced && isEligible(forced) ? forced : null;
  }
  const eligible = Object.values(PARTNERS).filter(isEligible);
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => b.priority - a.priority);
  return eligible[0];
}

function appendMarker(url: string, param: string | undefined, value: string): string {
  if (!param) return url;
  try {
    const u = new URL(url);
    u.searchParams.set(param, value);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Build the outbound affiliate URL for an offer.
 * Returns `null` when no partner is configured — callers should disable
 * the CTA and never fall back to a non-affiliate destination.
 */
export function buildAffiliateResolution(
  ctx: AffiliateContext,
): AffiliateResolution | null {
  const partner = resolveAffiliatePartner();
  if (!partner) return null;
  const url = appendMarker(partner.baseUrl, partner.markerParam, ctx.offer.id);
  return { partner, url };
}

/**
 * Back-compat convenience: returns a URL string or `null`.
 * Prefer `buildAffiliateResolution` when the partner metadata is useful.
 */
export function buildAffiliateUrl(ctx: AffiliateContext): string | null {
  return buildAffiliateResolution(ctx)?.url ?? null;
}
