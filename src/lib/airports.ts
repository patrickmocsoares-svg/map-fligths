/**
 * Airports data source (Lovable Cloud backed).
 *
 * The dataset lives in the `public.airports` table and is queried through
 * PostgREST. The public interface (`Airport`, `searchAirports`,
 * `getAirportByCode`) is kept stable so UI components don't change.
 *
 * `getAirportByCode` is synchronous by design (used inside `useMemo`).
 * It reads from an in-memory cache; on cache miss it triggers a fetch and
 * notifies subscribers via `useAirport(code)` so the UI re-renders when
 * the row arrives.
 */
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Airport = {
  code: string; // IATA
  city: string;
  name: string;
  country: string;
  countryCode?: string;
  region?: string;
};

type Row = {
  iata_code: string;
  icao_code: string | null;
  airport_name: string;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
};

function rowToAirport(r: Row): Airport {
  return {
    code: r.iata_code,
    city: r.city ?? "",
    name: r.airport_name,
    country: r.country ?? "",
  };
}

// -------- Cache + subscription for sync getAirportByCode() --------

const cache = new Map<string, Airport>();
const inflight = new Map<string, Promise<Airport | undefined>>();
const listeners = new Set<() => void>();
let version = 0;
function notify() {
  version++;
  listeners.forEach((fn) => fn());
}

function fetchByCode(code: string): Promise<Airport | undefined> {
  const key = code.toUpperCase();
  const existing = inflight.get(key);
  if (existing) return existing;
  const p = (async () => {
    const { data } = await supabase
      .from("airports")
      .select("iata_code, icao_code, airport_name, city, country, latitude, longitude")
      .eq("iata_code", key)
      .maybeSingle();
    if (data) {
      const a = rowToAirport(data as Row);
      cache.set(key, a);
      notify();
      return a;
    }
    return undefined;
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function getAirportByCode(code: string): Airport | undefined {
  if (!code) return undefined;
  const key = code.toUpperCase();
  const hit = cache.get(key);
  if (hit) return hit;
  // Fire and forget; hook consumers will re-render when it lands.
  void fetchByCode(key);
  return undefined;
}

/**
 * Reactive variant. Prefer this in components — it re-renders when the
 * airport row lands in the cache.
 */
export function useAirport(code: string): Airport | undefined {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      // Snapshot must be stable per version; reading from the cache is fine
      // because `notify()` bumps `version` on every insert.
      void version;
      return getAirportByCode(code);
    },
    () => undefined,
  );
}

// -------- Search --------

const searchCache = new Map<string, Airport[]>();

/**
 * Search worldwide airports by city, airport name, IATA code or country.
 * Empty query returns a curated set of popular hubs.
 */
export async function searchAirports(query: string, limit = 8): Promise<Airport[]> {
  const q = query.trim();
  const key = `${q.toLowerCase()}|${limit}`;
  const cached = searchCache.get(key);
  if (cached) return cached;

  let rows: Row[] = [];

  if (!q) {
    const { data } = await supabase
      .from("airports")
      .select("iata_code, icao_code, airport_name, city, country, latitude, longitude")
      .in("iata_code", POPULAR_HUBS)
      .limit(limit);
    rows = (data ?? []) as Row[];
  } else if (/^[a-zA-Z]{3}$/.test(q)) {
    // Exact IATA + prefix fallback
    const { data } = await supabase
      .from("airports")
      .select("iata_code, icao_code, airport_name, city, country, latitude, longitude")
      .or(`iata_code.eq.${q.toUpperCase()},iata_code.ilike.${q.toUpperCase()}%`)
      .limit(limit);
    rows = (data ?? []) as Row[];
  } else {
    const like = `%${q.replace(/[%_,]/g, " ").trim()}%`;
    const { data } = await supabase
      .from("airports")
      .select("iata_code, icao_code, airport_name, city, country, latitude, longitude")
      .or(
        `city.ilike.${like},airport_name.ilike.${like},country.ilike.${like},iata_code.ilike.${like}`,
      )
      .limit(limit * 4);
    rows = (data ?? []) as Row[];
  }

  const results = rows.map(rowToAirport);

  // Score/sort for relevance so results feel like a good autocomplete
  const ql = q.toLowerCase();
  results.sort((a, b) => score(b, ql) - score(a, ql));
  const trimmed = results.slice(0, limit);

  // Warm the by-code cache and notify subscribers
  trimmed.forEach((a) => cache.set(a.code, a));
  if (trimmed.length) notify();

  searchCache.set(key, trimmed);
  return trimmed;
}

function score(a: Airport, q: string): number {
  if (!q) return POPULAR_HUBS.indexOf(a.code) >= 0 ? 100 : 0;
  const code = a.code.toLowerCase();
  const city = a.city.toLowerCase();
  const name = a.name.toLowerCase();
  const country = a.country.toLowerCase();
  let s = 0;
  if (code === q) s += 1000;
  else if (code.startsWith(q)) s += 500;
  if (city === q) s += 400;
  else if (city.startsWith(q)) s += 200;
  else if (city.includes(q)) s += 80;
  if (name.startsWith(q)) s += 120;
  else if (name.includes(q)) s += 40;
  if (country.startsWith(q)) s += 60;
  else if (country.includes(q)) s += 20;
  return s;
}

// A curated default list for empty-query state (worldwide hubs)
const POPULAR_HUBS = [
  "GRU", "GIG", "BSB", "CNF", "REC", "SSA", "FOR",
  "MIA", "JFK", "LAX", "MCO", "DFW", "ORD",
  "LIS", "MAD", "BCN", "CDG", "LHR", "AMS", "FRA", "FCO",
  "DXB", "DOH", "IST", "GRU", "EZE", "SCL", "BOG", "LIM",
  "NRT", "HND", "ICN", "SIN", "HKG", "SYD",
];
