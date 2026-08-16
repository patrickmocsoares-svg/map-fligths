/**
 * Skyscanner Flights4 (RapidAPI) adapter — first attempt in the search
 * fallback chain. Any failure (404, 500, network, empty payload) resolves to
 * an empty offer list so the caller can fall back to Travelpayouts.
 */
import type {
  CabinClass,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResult,
} from "../types";

const HOST = "skyscanner-flights4.p.rapidapi.com";

function empty(params: FlightSearchParams): FlightSearchResult {
  return {
    provider: "skyscanner",
    searchedAt: new Date().toISOString(),
    params,
    currency: params.currency ?? "BRL",
    offers: [],
  };
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^\d.,-]/g, "").replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (obj[k] != null) return obj[k];
  return null;
}

function toOffer(
  raw: unknown,
  index: number,
  params: FlightSearchParams,
): FlightOffer | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const price = num(pick(r, ["price", "total_price", "amount", "min_price", "fare"]));
  if (price == null || price <= 0) return null;

  const airlineName =
    str(pick(r, ["airline", "carrier", "airline_name", "marketing_carrier"])) ??
    "Companhia aérea";
  const airlineCode = str(pick(r, ["airline_code", "carrier_code", "iata"])) ?? "--";
  const departureTime = str(pick(r, ["departure", "departure_time", "departAt"])) ?? "";
  const arrivalTime = str(pick(r, ["arrival", "arrival_time", "arriveAt"])) ?? "";
  const durationMin = num(pick(r, ["duration", "duration_minutes", "total_duration"])) ?? 0;
  const stops = num(pick(r, ["stops", "number_of_stops", "transfers"])) ?? 0;
  const currency = str(pick(r, ["currency", "currency_code"])) ?? params.currency ?? "BRL";
  const flightNumber = str(pick(r, ["flight_number", "flightNumber", "number"])) ?? "";

  const segment = {
    airlineCode,
    airlineName,
    flightNumber,
    originCode: params.origin,
    destinationCode: params.destination,
    departureTime,
    arrivalTime,
    durationMin,
    cabin: params.cabin as CabinClass,
  };

  return {
    id: str(pick(r, ["id", "offer_id", "uuid"])) ?? `skyscanner-${index}`,
    provider: "skyscanner",
    airline: { code: airlineCode, name: airlineName },
    flightNumber,
    departureTime,
    arrivalTime,
    durationMin,
    stops,
    outbound: { durationMin, stops, segments: [segment] },
    price,
    currency,
    cabin: params.cabin as CabinClass,
  };
}

function extractList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];
  const p = payload as Record<string, unknown>;
  for (const key of ["data", "results", "itineraries", "flights", "offers"]) {
    const v = p[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      const nested = extractList(v);
      if (nested.length) return nested;
    }
  }
  return [];
}

export async function searchSkyscanner(
  params: FlightSearchParams,
): Promise<FlightSearchResult> {
  const key = process.env["RAPIDAPI_KEY"];
  if (!key) return empty(params);

  const url = new URL(`https://${HOST}/api/v1/flights/search`);
  url.searchParams.set("origin", params.origin);
  url.searchParams.set("destination", params.destination);
  url.searchParams.set("date", params.departDate);
  if (params.returnDate) url.searchParams.set("returnDate", params.returnDate);
  url.searchParams.set("adults", String(params.passengers));
  url.searchParams.set("currency", params.currency ?? "BRL");
  url.searchParams.set("country", "BR");
  url.searchParams.set("locale", "pt-BR");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(url.toString(), {
      headers: { "x-rapidapi-key": key, "x-rapidapi-host": HOST },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.warn(`[skyscanner] HTTP ${res.status} — falling back`);
      return empty(params);
    }
    const payload = await res.json();
    const offers = extractList(payload)
      .map((raw, i) => toOffer(raw, i, params))
      .filter((o): o is FlightOffer => o !== null)
      .slice(0, params.limit ?? 20);
    return { ...empty(params), offers };
  } catch (e) {
    console.warn("[skyscanner] request failed, falling back to Travelpayouts", e);
    return empty(params);
  }
}
