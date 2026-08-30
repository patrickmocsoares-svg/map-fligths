/**
 * MAB Opportunity Discovery Engine — server functions.
 *
 * The engine periodically sweeps a curated list of popular Brazil-origin
 * routes (domestic, South America, USA, Europe), calls the active flight
 * provider for each, and lets every provider adapter record observations
 * into `public.price_history`. Downstream:
 *
 *   - `route_price_stats` produces per-route benchmarks
 *   - `computeMabScoreFromStats` turns each new price into a MAB Score
 *   - `findOpportunitiesFn` surfaces routes trading well below their
 *     historical average as automatic deals
 *
 * The discovery sweep is provider-agnostic: whichever real upstream is
 * configured (Duffel / Kiwi / Amadeus) feeds real prices; the dev provider
 * feeds synthetic-but-realistic prices so the engine works end-to-end
 * without any external key.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { POPULAR_ROUTES, type RouteRegion } from "./discovery/popular-routes";
import { computeMabScoreFromStats, type MabScore } from "./mab-score";
import type { SweepReport } from "./discovery/sweep.server";

export type { SweepReport } from "./discovery/sweep.server";

const cabinEnum = z.enum(["economy", "premium", "business", "first"]);

const sweepSchema = z.object({
  regions: z.array(z.enum(["domestic", "south_america", "usa", "europe"])).optional(),
  cabin: cabinEnum.optional().default("economy"),
  horizons: z.array(z.number().int().min(1).max(365)).optional(),
  maxRoutes: z.number().int().min(1).max(200).optional().default(60),
});

/**
 * Admin-only manual trigger for the discovery sweep. The scheduled run goes
 * through `/api/public/hooks/discover-prices`, which authenticates with a
 * dedicated server-side secret.
 */
export const runDiscoverySweepFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => sweepSchema.parse(input ?? {}))
  .handler(async ({ data, context }): Promise<SweepReport> => {
    const { assertAdmin } = await import("./security/guards.server");
    await assertAdmin(context.supabase, context.userId);
    const { runDiscoverySweep } = await import("./discovery/sweep.server");
    return runDiscoverySweep(data);
  });


// --- Opportunities of the Day -----------------------------------------------

const feedSchema = z.object({
  cabin: cabinEnum.optional().default("economy"),
  minDiscountPct: z.number().int().min(0).max(90).optional().default(15),
  limit: z.number().int().min(1).max(50).optional().default(24),
});

export type OpportunityInsight = {
  origin: string;
  destination: string;
  region: RouteRegion | "other";
  cabin: string;
  currency: string;
  price: number;
  avgPrice: number;
  minPrice: number;
  previousPrice: number | null;
  discountPct: number;
  samples: number;
  lastSearchedAt: string;
  score: MabScore;
  /** Why this route made the feed. Drives UI badging. */
  reasons: Array<"unusual_low" | "price_drop" | "below_average">;
};

function regionOf(origin: string, destination: string): RouteRegion | "other" {
  const hit = POPULAR_ROUTES.find(
    (r) => r.origin === origin && r.destination === destination,
  );
  return hit?.region ?? "other";
}

/**
 * Build the "Opportunities of the Day" feed. Aggregates recent
 * `price_history` observations, keeps only routes whose latest price is
 * meaningfully below the historical average, and tags each with the
 * reason it qualified: unusual low, price drop, or below average.
 */
export const getOpportunitiesOfTheDayFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => feedSchema.parse(input ?? {}))
  .handler(async ({ data }): Promise<OpportunityInsight[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const since = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const { data: rows, error } = await supabaseAdmin
      .from("price_history")
      .select("origin_iata, destination_iata, cabin, currency, price, searched_at")
      .eq("cabin", data.cabin)
      .gte("searched_at", since)
      .order("searched_at", { ascending: false })
      .limit(8000);
    if (error) throw new Error(error.message);

    type Row = {
      origin_iata: string;
      destination_iata: string;
      cabin: string;
      currency: string;
      price: number;
      searched_at: string;
    };

    const buckets = new Map<string, Row[]>();
    for (const r of (rows ?? []) as Row[]) {
      const key = `${r.origin_iata}-${r.destination_iata}-${r.currency}`;
      const arr = buckets.get(key);
      if (arr) arr.push(r);
      else buckets.set(key, [r]);
    }

    const out: OpportunityInsight[] = [];
    for (const arr of buckets.values()) {
      if (arr.length < 3) continue;
      // arr is sorted DESC by searched_at
      const latest = arr[0];
      const previous = arr[1] ?? null;
      const prices = arr.map((r) => Number(r.price));
      const avg = prices.reduce((a, x) => a + x, 0) / prices.length;
      const min = Math.min(...prices);
      const current = Number(latest.price);

      const score = computeMabScoreFromStats({
        price: current,
        avgPrice: avg,
        minPrice: min,
        previousPrice: previous ? Number(previous.price) : undefined,
        samples: arr.length,
      });

      if (score.discountPct < data.minDiscountPct) continue;

      const reasons: OpportunityInsight["reasons"] = [];
      if (current <= min * 1.05) reasons.push("unusual_low");
      if (previous && Number(previous.price) > 0) {
        const delta = (current - Number(previous.price)) / Number(previous.price);
        if (delta <= -0.08) reasons.push("price_drop");
      }
      if (score.discountPct >= 15) reasons.push("below_average");
      if (reasons.length === 0) continue;

      out.push({
        origin: latest.origin_iata,
        destination: latest.destination_iata,
        region: regionOf(latest.origin_iata, latest.destination_iata),
        cabin: latest.cabin,
        currency: latest.currency,
        price: current,
        avgPrice: Math.round(avg),
        minPrice: Math.round(min),
        previousPrice: previous ? Number(previous.price) : null,
        discountPct: score.discountPct,
        samples: arr.length,
        lastSearchedAt: latest.searched_at,
        score,
        reasons,
      });
    }

    out.sort((a, b) => b.score.score - a.score.score || b.discountPct - a.discountPct);
    return out.slice(0, data.limit);
  });
