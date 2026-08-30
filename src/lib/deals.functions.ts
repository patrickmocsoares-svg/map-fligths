/**
 * Deals Intelligence — server functions.
 *
 * Reads historical price stats from `public.price_history` (via the
 * `route_price_stats` SQL helper) and records new price observations. This
 * is the backend foundation for automatic deal discovery: a scheduled job
 * (or the search flow) inserts observations here, and the UI queries the
 * aggregates through these fns.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";


const iata = z.string().length(3).regex(/^[A-Za-z]{3}$/);
const cabinEnum = z.enum(["economy", "premium", "business", "first"]);

const statsSchema = z.object({
  origin: iata,
  destination: iata,
  cabin: cabinEnum.optional().default("economy"),
  days: z.number().int().min(1).max(365).optional().default(90),
});

export type RouteStats = {
  samples: number;
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  p25Price: number | null;
  p50Price: number | null;
  p75Price: number | null;
  lastPrice: number | null;
  lastSearchedAt: string | null;
};

export const getRouteStatsFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => statsSchema.parse(input))
  .handler(async ({ data }): Promise<RouteStats> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("route_price_stats", {
      _origin: data.origin.toUpperCase(),
      _destination: data.destination.toUpperCase(),
      _cabin: data.cabin,
      _days: data.days,
    });
    if (error) throw new Error(error.message);
    const r = (Array.isArray(rows) ? rows[0] : rows) as
      | {
          samples: number;
          avg_price: string | number | null;
          min_price: string | number | null;
          max_price: string | number | null;
          p25_price: string | number | null;
          p50_price: string | number | null;
          p75_price: string | number | null;
          last_price: string | number | null;
          last_searched_at: string | null;
        }
      | undefined;
    const num = (v: string | number | null | undefined) =>
      v == null ? null : typeof v === "number" ? v : Number(v);
    return {
      samples: r?.samples ?? 0,
      avgPrice: num(r?.avg_price),
      minPrice: num(r?.min_price),
      maxPrice: num(r?.max_price),
      p25Price: num(r?.p25_price),
      p50Price: num(r?.p50_price),
      p75Price: num(r?.p75_price),
      lastPrice: num(r?.last_price),
      lastSearchedAt: r?.last_searched_at ?? null,
    };
  });

const observationSchema = z.object({
  origin: iata,
  destination: iata,
  airline: z.string().min(1).max(8).optional(),
  cabin: cabinEnum.default("economy"),
  price: z.number().positive().max(10_000_000),
  currency: z.string().length(3).default("BRL"),
  flightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: z.string().max(64).default("search"),
});

/**
 * Record a single observed price. Restricted to authenticated admins —
 * provider adapters and the discovery sweep write to `price_history`
 * server-side, so no public caller needs this endpoint.
 */
export const recordPriceObservationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => observationSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("./security/guards.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("price_history").insert({
      origin_iata: data.origin,
      destination_iata: data.destination,
      airline: data.airline ?? null,
      cabin: data.cabin,
      price: data.price,
      currency: data.currency,
      flight_date: data.flightDate,
      source: data.source,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });


const opportunitySchema = z.object({
  origin: iata.optional(),
  cabin: cabinEnum.optional().default("economy"),
  limit: z.number().int().min(1).max(50).optional().default(12),
  /** Minimum % savings vs. route average to qualify as an opportunity. */
  minDiscountPct: z.number().int().min(0).max(90).optional().default(15),
});

export type Opportunity = {
  origin: string;
  destination: string;
  cabin: string;
  currency: string;
  price: number;
  avgPrice: number;
  minPrice: number;
  discountPct: number;
  samples: number;
  lastSearchedAt: string;
};

/**
 * Automatic deal discovery: scans recent price observations, aggregates per
 * route, and returns routes whose latest price beats the historical average
 * by at least `minDiscountPct`. Scheduled jobs can call this to populate a
 * "today's opportunities" surface without any provider integration.
 */
export const findOpportunitiesFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => opportunitySchema.parse(input))
  .handler(async ({ data }): Promise<Opportunity[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Pull recent observations for the requested cabin (last 90 days), then
    // aggregate in JS — small enough to be cheap, no bespoke SQL required.
    let q = supabaseAdmin
      .from("price_history")
      .select("origin_iata, destination_iata, cabin, currency, price, searched_at")
      .eq("cabin", data.cabin)
      .gte("searched_at", new Date(Date.now() - 90 * 86_400_000).toISOString())
      .order("searched_at", { ascending: false })
      .limit(5000);
    if (data.origin) q = q.eq("origin_iata", data.origin.toUpperCase());
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    type Row = {
      origin_iata: string;
      destination_iata: string;
      cabin: string;
      currency: string;
      price: number;
      searched_at: string;
    };

    const buckets = new Map<
      string,
      { rows: Row[]; latest: Row }
    >();
    for (const r of (rows ?? []) as Row[]) {
      const key = `${r.origin_iata}-${r.destination_iata}-${r.currency}`;
      const b = buckets.get(key);
      if (!b) buckets.set(key, { rows: [r], latest: r });
      else {
        b.rows.push(r);
        if (r.searched_at > b.latest.searched_at) b.latest = r;
      }
    }

    const opps: Opportunity[] = [];
    for (const b of buckets.values()) {
      if (b.rows.length < 3) continue; // need a benchmark
      const prices = b.rows.map((r) => Number(r.price));
      const avg = prices.reduce((a, x) => a + x, 0) / prices.length;
      const min = Math.min(...prices);
      const current = Number(b.latest.price);
      const discountPct = Math.round(((avg - current) / avg) * 100);
      if (discountPct < data.minDiscountPct) continue;
      opps.push({
        origin: b.latest.origin_iata,
        destination: b.latest.destination_iata,
        cabin: b.latest.cabin,
        currency: b.latest.currency,
        price: current,
        avgPrice: Math.round(avg),
        minPrice: Math.round(min),
        discountPct,
        samples: b.rows.length,
        lastSearchedAt: b.latest.searched_at,
      });
    }

    opps.sort((a, b) => b.discountPct - a.discountPct);
    return opps.slice(0, data.limit);
  });
