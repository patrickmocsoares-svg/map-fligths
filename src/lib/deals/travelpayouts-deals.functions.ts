/**
 * Server-side deal & discovery layer backed 100% by Travelpayouts Data API.
 *
 * Public UI never receives fabricated prices. When the upstream cache has
 * nothing for a route, `price` is omitted and the card renders in editorial
 * mode. Token stays server-side; results cached in-memory for 10 minutes.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RealDeal, NearbyDate } from "./types";

const LATEST_URL = "https://api.travelpayouts.com/aviasales/v3/get_latest_prices";
const GROUPED_URL = "https://api.travelpayouts.com/aviasales/v3/grouped_prices";
const TTL_MS = 10 * 60 * 1000;
const memo = new Map<string, { at: number; value: unknown }>();

function cache<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = memo.get(key);
  if (hit && Date.now() - hit.at < ttl) return Promise.resolve(hit.value as T);
  return load().then((value) => {
    memo.set(key, { at: Date.now(), value });
    return value;
  });
}

type TpItem = {
  origin: string;
  destination: string;
  price: number;
  airline?: string;
  departure_at?: string;
  return_at?: string;
  transfers?: number;
  duration?: number;
  duration_to?: number;
  found_at?: string;
};

async function tpFetch(url: URL): Promise<TpItem[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch(url, {
      headers: { "X-Access-Token": token, accept: "application/json" },
    });
    if (!res.ok) {
      console.warn("[deals][tp] upstream not ok", { status: res.status, url: url.toString() });
      return [];
    }
    const json = (await res.json()) as { success?: boolean; data?: TpItem[] };
    if (json.success === false) return [];
    return json.data ?? [];
  } catch (e) {
    console.warn("[deals][tp] fetch failed", { message: (e as Error).message });
    return [];
  }
}

// ── Destination metadata (server-safe copy) ────────────────────────────
// Kept in sync with `src/lib/destinations.ts`. We only ship well-known
// destinations to the public UI so cards never show blank city/country.
import { DESTINATIONS } from "@/lib/destinations";

function classify(destCode: string): "domestic" | "international" | null {
  const d = DESTINATIONS[destCode];
  if (!d) return null;
  return d.country === "Brasil" ? "domestic" : "international";
}

// ────────────────────────────────────────────────────────────────────────
// getCuratedDealsFn
// ────────────────────────────────────────────────────────────────────────
const curatedSchema = z.object({
  origin: z.string().length(3).optional(),
  limit: z.number().int().min(1).max(60).optional(),
});

export const getCuratedDealsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => curatedSchema.parse(raw ?? {}))
  .handler(async ({ data }): Promise<RealDeal[]> => {
    const origin = (data.origin ?? "GRU").toUpperCase();
    const limit = data.limit ?? 30;
    const key = `curated:${origin}:${limit}`;
    return cache(key, TTL_MS, async () => {
      const url = new URL(LATEST_URL);
      url.searchParams.set("origin", origin);
      url.searchParams.set("currency", "brl");
      url.searchParams.set("period_type", "year");
      url.searchParams.set("sorting", "price");
      url.searchParams.set("one_way", "false");
      url.searchParams.set("page", "1");
      url.searchParams.set("limit", String(limit));
      const items = await tpFetch(url);

      // Group by destination: keep cheapest per route, compute avg over sample.
      const byDest = new Map<string, { items: TpItem[] }>();
      for (const it of items) {
        const cat = classify(it.destination);
        if (!cat) continue;
        const bucket = byDest.get(it.destination) ?? { items: [] };
        bucket.items.push(it);
        byDest.set(it.destination, bucket);
      }

      const deals: RealDeal[] = [];
      for (const [dest, { items: group }] of byDest) {
        const meta = DESTINATIONS[dest];
        if (!meta) continue;
        const sorted = [...group].sort((a, b) => a.price - b.price);
        const cheapest = sorted[0];
        const avg = Math.round(
          group.reduce((s, x) => s + x.price, 0) / Math.max(1, group.length),
        );
        deals.push({
          id: `${origin}-${dest}-${cheapest.departure_at ?? "any"}`,
          originCode: origin,
          destinationCode: dest,
          destinationCity: meta.city,
          destinationCountry: meta.country,
          airlineCode: cheapest.airline,
          departDate: cheapest.departure_at?.slice(0, 10),
          returnDate: cheapest.return_at?.slice(0, 10),
          price: Math.round(cheapest.price),
          avgPrice: avg > cheapest.price ? avg : undefined,
          currency: "BRL",
          stops: cheapest.transfers ?? 0,
          durationMin: cheapest.duration_to ?? cheapest.duration,
          category: classify(dest) as "domestic" | "international",
          editorial: false,
          foundAt: cheapest.found_at ?? new Date().toISOString(),
        });
      }
      return deals.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    });
  });

// ────────────────────────────────────────────────────────────────────────
// getNearbyDatesFn — Price Matrix for empty search states
// ────────────────────────────────────────────────────────────────────────
const nearbySchema = z.object({
  origin: z.string().length(3),
  destination: z.string().length(3),
  around: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const getNearbyDatesFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => nearbySchema.parse(raw))
  .handler(async ({ data }): Promise<NearbyDate[]> => {
    const origin = data.origin.toUpperCase();
    const destination = data.destination.toUpperCase();
    const key = `nearby:${origin}:${destination}:${data.around ?? ""}`;
    return cache(key, TTL_MS, async () => {
      const url = new URL(GROUPED_URL);
      url.searchParams.set("origin", origin);
      url.searchParams.set("destination", destination);
      url.searchParams.set("currency", "brl");
      url.searchParams.set("group_by", "departure_at");
      const items = await tpFetch(url);
      // `grouped_prices` returns `{ data: { date: {price,...} } }` — but
      // tpFetch normalised the outer shape. Handle both:
      const dates: NearbyDate[] = [];
      // Some responses come back as items[]; others as an object map.
      // Re-fetch raw to be safe.
      try {
        const token = process.env.TRAVELPAYOUTS_TOKEN;
        if (!token) return [];
        const res = await fetch(url, {
          headers: { "X-Access-Token": token, accept: "application/json" },
        });
        if (!res.ok) return [];
        const raw = (await res.json()) as {
          data?: Record<string, { price?: number }> | TpItem[];
        };
        if (Array.isArray(raw.data)) {
          for (const it of raw.data) {
            if (it.departure_at && typeof it.price === "number") {
              dates.push({
                date: it.departure_at.slice(0, 10),
                price: Math.round(it.price),
                currency: "BRL",
              });
            }
          }
        } else if (raw.data && typeof raw.data === "object") {
          for (const [date, v] of Object.entries(raw.data)) {
            if (v && typeof v.price === "number") {
              dates.push({ date, price: Math.round(v.price), currency: "BRL" });
            }
          }
        }
      } catch {
        return items.length ? [] : [];
      }
      // Prefer dates near `around` (±30 days). Sort by proximity then price.
      const anchor = data.around ? new Date(`${data.around}T00:00:00`).getTime() : 0;
      return dates
        .filter((d) => !!d.price)
        .sort((a, b) => {
          if (anchor) {
            const da = Math.abs(new Date(`${a.date}T00:00:00`).getTime() - anchor);
            const db = Math.abs(new Date(`${b.date}T00:00:00`).getTime() - anchor);
            if (da !== db) return da - db;
          }
          return a.price - b.price;
        })
        .slice(0, 8);
    });
  });

// ────────────────────────────────────────────────────────────────────────
// getPopularFromCityFn — feed for empty search state
// ────────────────────────────────────────────────────────────────────────
const popularSchema = z.object({
  origin: z.string().length(3),
  limit: z.number().int().min(1).max(24).optional(),
});

export const getPopularFromCityFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => popularSchema.parse(raw))
  .handler(async ({ data }): Promise<RealDeal[]> => {
    const all = await getCuratedDealsFn({
      data: { origin: data.origin, limit: 40 },
    } as never);
    return (all as RealDeal[]).slice(0, data.limit ?? 8);
  });
