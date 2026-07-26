/**
 * Affiliate URL builder.
 *
 * Reads from the partner registry in `./affiliate-config.ts` and returns
 * the deep link to open when the user clicks "Continuar compra".
 *
 * - Preserves the partner's tracking URL byte-for-byte; only appends
 *   query params (offer marker + sub_id with search context).
 * - Returns `null` when no partner is configured, so the UI can render
 *   a disabled CTA instead of leaking traffic to a non-affiliate site.
 */
import type { FlightOffer, FlightSearchParams } from "@/lib/flights/types";
import { getActivePartner, type PartnerConfig } from "@/lib/affiliate-config";

export type AffiliateContext = {
  offer: FlightOffer;
  params: FlightSearchParams;
};

export type AffiliateTarget = {
  url: string;
  partner: PartnerConfig;
  subId: string;
};

function buildSubId(ctx: AffiliateContext): string {
  const p = ctx.params;
  const parts = [
    p.origin,
    p.destination,
    p.departDate,
    p.returnDate ?? "ow",
    p.cabin ?? "economy",
    `p${p.passengers ?? 1}`,
    ctx.offer.id,
  ];
  return parts.join("-").replace(/[^a-zA-Z0-9-]/g, "");
}

function appendParams(baseUrl: string, partner: PartnerConfig, ctx: AffiliateContext): string {
  try {
    const u = new URL(baseUrl);
    const offerParam = partner.offerMarkerParam ?? "mab_offer";
    u.searchParams.set(offerParam, ctx.offer.id);
    if (partner.subIdParam) {
      u.searchParams.set(partner.subIdParam, buildSubId(ctx));
    }
    return u.toString();
  } catch {
    return baseUrl;
  }
}

/**
 * Preferred API: returns full target metadata (url + partner) or null.
 */
export function resolveAffiliateTarget(ctx: AffiliateContext): AffiliateTarget | null {
  const partner = getActivePartner();
  if (!partner) return null;
  const url = appendParams(partner.baseUrl, partner, ctx);
  return { url, partner, subId: buildSubId(ctx) };
}

/**
 * Backwards-compatible helper. Returns "" when no partner is configured
 * so existing consumers that only check truthiness continue to work.
 */
export function buildAffiliateUrl(ctx: AffiliateContext): string {
  return resolveAffiliateTarget(ctx)?.url ?? "";
}
