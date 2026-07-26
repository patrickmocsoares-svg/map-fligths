/**
 * Travelpayouts Data API — flight price adapter (Phase 1).
 *
 * Uses the public "prices_for_dates" endpoint (Aviasales cache). Prices are
 * indicative — the final value is confirmed by the partner at checkout.
 * The affiliate `marker` is propagated so every outbound click is attributed.
 *
 * Docs:
 *  - https://support.travelpayouts.com/hc/en-us/articles/203956
 *  - https://api.travelpayouts.com/aviasales/v3/prices_for_dates
 *
 * Configuration (server-only env):
 *   TRAVELPAYOUTS_TOKEN   - API token (header: `X-Access-Token`)
 *   TRAVELPAYOUTS_MARKER  - optional affiliate marker id
 */
import type {
  FlightItinerary,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResult,
  FlightSegment,
} from "../types";
import { ProviderError, type FlightProvider } from "../provider";

const BASE_URL = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates";
const PING_URL = "https://api.travelpayouts.com/aviasales/v3/get_latest_prices";

// In-memory cache (per Worker instance). Keyed by search args. Short TTL
// keeps prices reasonably fresh while cutting upstream calls dramatically.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const cache = new Map<string, { at: number; result: FlightSearchResult }>();

function cacheKey(p: FlightSearchParams): string {
  return [
    p.origin,
    p.destination,
    p.departDate,
    p.returnDate ?? "",
    p.cabin,
    p.currency ?? "BRL",
    p.passengers,
  ].join("|");
}

type TpItem = {
  origin: string;
  destination: string;
  origin_airport?: string;
  destination_airport?: string;
  price: number;
  airline: string;
  flight_number: number | string;
  departure_at: string;
  return_at?: string;
  transfers: number;
  return_transfers?: number;
  duration?: number;
  duration_to?: number;
  duration_back?: number;
  link?: string;
};

type TpResponse = {
  success?: boolean;
  data?: TpItem[];
  currency?: string;
  error?: string;
};

function addMinutes(iso: string, min: number): string {
  return new Date(new Date(iso).getTime() + min * 60_000).toISOString();
}

function buildItinerary(
  originIata: string,
  destinationIata: string,
  departureAt: string,
  totalMin: number,
  stops: number,
  airlineCode: string,
  flightNumber: string,
  cabin: FlightSearchParams["cabin"],
): FlightItinerary {
  // Travelpayouts data API returns only aggregated durations, not per-segment
  // schedules. We synthesize a single umbrella segment (or split evenly for a
  // 1-stop cache hit) so the neutral FlightOffer contract stays satisfied.
  const safeTotal = Math.max(45, totalMin || 120);
  const segments: FlightSegment[] = [];
  if (stops <= 0) {
    segments.push({
      airlineCode,
      airlineName: airlineCode,
      flightNumber,
      originCode: originIata,
      destinationCode: destinationIata,
      departureTime: departureAt,
      arrivalTime: addMinutes(departureAt, safeTotal),
      durationMin: safeTotal,
      cabin,
    });
  } else {
    const layover = 75;
    const leg = Math.max(45, Math.floor((safeTotal - layover) / 2));
    const midDep = addMinutes(departureAt, leg);
    const midArr = addMinutes(midDep, layover);
    segments.push(
      {
        airlineCode,
        airlineName: airlineCode,
        flightNumber,
        originCode: originIata,
        destinationCode: "___",
        departureTime: departureAt,
        arrivalTime: midDep,
        durationMin: leg,
        cabin,
      },
      {
        airlineCode,
        airlineName: airlineCode,
        flightNumber,
        originCode: "___",
        destinationCode: destinationIata,
        departureTime: midArr,
        arrivalTime: addMinutes(departureAt, safeTotal),
        durationMin: Math.max(45, safeTotal - leg - layover),
        cabin,
      },
    );
  }
  return { durationMin: safeTotal, stops: Math.max(0, stops), segments };
}

function appendMarker(link: string | undefined, marker: string | undefined): string | undefined {
  if (!link) return undefined;
  const abs = link.startsWith("http") ? link : `https://www.aviasales.com${link}`;
  if (!marker) return abs;
  try {
    const u = new URL(abs);
    u.searchParams.set("marker", marker);
    return u.toString();
  } catch {
    return abs;
  }
}

function mapItem(
  item: TpItem,
  params: FlightSearchParams,
  currency: string,
  marker: string | undefined,
  idx: number,
): FlightOffer {
  const outbound = buildItinerary(
    item.origin,
    item.destination,
    item.departure_at,
    item.duration_to ?? item.duration ?? 0,
    item.transfers ?? 0,
    item.airline,
    String(item.flight_number),
    params.cabin,
  );
  const ret =
    item.return_at && (item.duration_back ?? 0) > 0
      ? buildItinerary(
          item.destination,
          item.origin,
          item.return_at,
          item.duration_back ?? 0,
          item.return_transfers ?? 0,
          item.airline,
          String(item.flight_number),
          params.cabin,
        )
      : undefined;
  const totalPrice = Math.round(item.price * Math.max(1, params.passengers));
  const head = outbound.segments[0];
  const tail = outbound.segments[outbound.segments.length - 1];
  return {
    id: `travelpayouts:${item.origin}-${item.destination}-${item.departure_at}-${idx}`,
    provider: "travelpayouts",
    airline: { code: item.airline, name: item.airline },
    flightNumber: String(item.flight_number),
    departureTime: head.departureTime,
    arrivalTime: tail.arrivalTime,
    durationMin: outbound.durationMin,
    stops: outbound.stops,
    outbound,
    return: ret,
    price: totalPrice,
    currency,
    cabin: params.cabin,
    // Attach the affiliate deep link on the offer id via a side channel:
    // consumers read `link` if they need a partner-specific override. For
    // now we keep the shape neutral and let the central affiliate resolver
    // choose the outbound URL.
    ...(appendMarker(item.link, marker) ? { deepLink: appendMarker(item.link, marker) } : {}),
  } as FlightOffer;
}

async function recordObservations(
  offers: FlightOffer[],
  params: FlightSearchParams,
): Promise<void> {
  if (offers.length === 0) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = offers.map((o) => ({
      source: "travelpayouts",
      origin_iata: params.origin,
      destination_iata: params.destination,
      airline: o.airline.code || null,
      cabin: o.cabin,
      price: o.price,
      currency: o.currency,
      flight_date: params.departDate,
    }));
    await supabaseAdmin.from("price_history").insert(rows);
  } catch {
    // Non-fatal.
  }
}

export const travelpayoutsProvider: FlightProvider = {
  id: "travelpayouts",
  label: "Travelpayouts Data API",
  real: true,
  requiredSecrets: ["TRAVELPAYOUTS_TOKEN"],

  isConfigured() {
    return Boolean(process.env.TRAVELPAYOUTS_TOKEN);
  },

  async status() {
    if (!this.isConfigured()) {
      return {
        id: "travelpayouts",
        label: "Travelpayouts Data API",
        state: "missing_credentials",
        real: true,
        requiredSecrets: ["TRAVELPAYOUTS_TOKEN"],
        message: "Defina TRAVELPAYOUTS_TOKEN para ativar preços indicativos.",
      };
    }
    try {
      const url = new URL(PING_URL);
      url.searchParams.set("currency", "brl");
      url.searchParams.set("limit", "1");
      const res = await fetch(url, {
        headers: {
          "X-Access-Token": process.env.TRAVELPAYOUTS_TOKEN!,
          accept: "application/json",
        },
      });
      if (res.status === 401 || res.status === 403) {
        return { id: "travelpayouts", label: "Travelpayouts Data API", state: "error", real: true, message: "Token rejeitado." };
      }
      if (!res.ok) {
        return { id: "travelpayouts", label: "Travelpayouts Data API", state: "error", real: true, message: `HTTP ${res.status}` };
      }
      return { id: "travelpayouts", label: "Travelpayouts Data API", state: "connected", real: true };
    } catch (e) {
      return { id: "travelpayouts", label: "Travelpayouts Data API", state: "error", real: true, message: (e as Error).message };
    }
  },

  async search(params: FlightSearchParams): Promise<FlightSearchResult> {
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) {
      throw new ProviderError("travelpayouts", "not_configured", "TRAVELPAYOUTS_TOKEN not set");
    }

    const key = cacheKey(params);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
      return hit.result;
    }

    const marker = process.env.TRAVELPAYOUTS_MARKER;
    const currency = (params.currency ?? "BRL").toLowerCase();

    const url = new URL(BASE_URL);
    url.searchParams.set("origin", params.origin);
    url.searchParams.set("destination", params.destination);
    url.searchParams.set("departure_at", params.departDate);
    if (params.returnDate) url.searchParams.set("return_at", params.returnDate);
    url.searchParams.set("currency", currency);
    url.searchParams.set("unique", "false");
    url.searchParams.set("sorting", "price");
    url.searchParams.set("direct", "false");
    url.searchParams.set("limit", String(Math.min(params.limit ?? 20, 30)));
    url.searchParams.set("page", "1");
    if (marker) url.searchParams.set("marker", marker);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { "X-Access-Token": token, accept: "application/json" },
      });
    } catch (e) {
      throw new ProviderError("travelpayouts", "upstream_error", (e as Error).message);
    }
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("travelpayouts", "unauthorized", "TRAVELPAYOUTS_TOKEN rejected");
    }
    if (res.status === 429) {
      throw new ProviderError("travelpayouts", "rate_limited", "Travelpayouts rate limit exceeded");
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError("travelpayouts", "upstream_error", `HTTP ${res.status}: ${body.slice(0, 200)}`);
    }

    const payload = (await res.json()) as TpResponse;
    if (payload.success === false) {
      throw new ProviderError("travelpayouts", "upstream_error", payload.error ?? "unknown error");
    }
    const resCurrency = (payload.currency ?? currency).toUpperCase();
    const items = payload.data ?? [];
    const offers = items.map((it, i) => mapItem(it, params, resCurrency, marker, i));

    const result: FlightSearchResult = {
      provider: "travelpayouts",
      searchedAt: new Date().toISOString(),
      params,
      currency: resCurrency,
      offers,
    };

    cache.set(key, { at: Date.now(), result });
    await recordObservations(offers, params);

    return result;
  },
};
