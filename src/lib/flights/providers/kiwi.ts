/**
 * Kiwi.com Tequila — Flight search adapter.
 *
 * Docs: https://tequila.kiwi.com/portal/docs/tequila_api/search_api
 *
 * This is TRIPmoc' first real upstream provider. It maps Tequila's
 * native `/v2/search` response into the neutral `FlightOffer` shape used
 * by the rest of the app. UI code never sees Tequila-native fields.
 *
 * Configuration (server-only env):
 *   KIWI_API_KEY       - Tequila API key (header: `apikey`)
 *   KIWI_AFFILIATE_ID  - optional partner/affiliate marker
 *   KIWI_BASE_URL      - defaults to https://api.tequila.kiwi.com
 */
import type {
  CabinClass,
  FlightItinerary,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResult,
  FlightSegment,
} from "../types";
import { ProviderError, type FlightProvider } from "../provider";

const DEFAULT_BASE_URL = "https://api.tequila.kiwi.com";

// Tequila expects dd/mm/yyyy for date_from/date_to.
function toTequilaDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function cabinToTequila(c: CabinClass): "M" | "W" | "C" | "F" {
  switch (c) {
    case "premium":
      return "W";
    case "business":
      return "C";
    case "first":
      return "F";
    default:
      return "M";
  }
}

function tequilaCabinToUs(v: string | undefined): CabinClass {
  switch ((v ?? "").toUpperCase()) {
    case "W":
      return "premium";
    case "C":
      return "business";
    case "F":
      return "first";
    default:
      return "economy";
  }
}

// Tequila `utc` fields look like `2026-08-14T09:15:00.000Z`. We keep them
// as ISO strings and expose them through the neutral shape unchanged.
type TequilaRoute = {
  id: string;
  flyFrom: string;
  flyTo: string;
  cityFrom?: string;
  cityTo?: string;
  airline: string; // IATA carrier code
  flight_no: number;
  local_departure: string;
  local_arrival: string;
  utc_departure: string;
  utc_arrival: string;
  fare_classes?: string;
  fare_category?: string;
  return: 0 | 1;
  equipment?: string | null;
};

type TequilaOffer = {
  id: string;
  price: number;
  deep_link?: string;
  airlines: string[];
  route: TequilaRoute[];
  duration?: { departure: number; return?: number; total?: number };
  nightsInDest?: number;
  local_departure: string;
  local_arrival: string;
};

type TequilaResponse = {
  currency: string;
  data: TequilaOffer[];
  search_params?: { seats?: { passengers?: number } };
};

function minutesBetween(a: string, b: string): number {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60_000));
}

function buildItinerary(
  segments: TequilaRoute[],
  cabin: CabinClass,
): FlightItinerary {
  const mapped: FlightSegment[] = segments.map((s) => ({
    airlineCode: s.airline,
    // Tequila does not include a human airline name in the search payload;
    // the UI already resolves names from its airline catalog, so we mirror
    // the code here to keep the contract satisfied.
    airlineName: s.airline,
    flightNumber: String(s.flight_no),
    originCode: s.flyFrom,
    destinationCode: s.flyTo,
    departureTime: s.utc_departure,
    arrivalTime: s.utc_arrival,
    durationMin: minutesBetween(s.utc_departure, s.utc_arrival),
    aircraft: s.equipment ?? undefined,
    cabin: tequilaCabinToUs(s.fare_classes) ?? cabin,
  }));
  const first = mapped[0];
  const last = mapped[mapped.length - 1];
  return {
    durationMin: first && last ? minutesBetween(first.departureTime, last.arrivalTime) : 0,
    stops: Math.max(0, mapped.length - 1),
    segments: mapped,
  };
}

function mapOffer(
  raw: TequilaOffer,
  params: FlightSearchParams,
  currency: string,
): FlightOffer {
  const outboundSegs = raw.route.filter((r) => r.return === 0);
  const returnSegs = raw.route.filter((r) => r.return === 1);
  const outbound = buildItinerary(outboundSegs, params.cabin);
  const ret = returnSegs.length ? buildItinerary(returnSegs, params.cabin) : undefined;
  const head = outbound.segments[0];
  const tail = outbound.segments[outbound.segments.length - 1];

  return {
    id: `kiwi:${raw.id}`,
    provider: "kiwi",
    airline: { code: raw.airlines[0] ?? head?.airlineCode ?? "", name: raw.airlines[0] ?? head?.airlineCode ?? "" },
    flightNumber: head?.flightNumber ?? "",
    departureTime: head?.departureTime ?? raw.local_departure,
    arrivalTime: tail?.arrivalTime ?? raw.local_arrival,
    durationMin: outbound.durationMin,
    stops: outbound.stops,
    outbound,
    return: ret,
    price: raw.price,
    currency,
    cabin: params.cabin,
  };
}

async function recordObservations(
  offers: FlightOffer[],
  params: FlightSearchParams,
): Promise<void> {
  if (offers.length === 0) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const rows = offers.map((o) => ({
      source: "kiwi",
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
    // Observability, not correctness — never fail the search over history writes.
  }
}

export const kiwiProvider: FlightProvider = {
  id: "kiwi",
  label: "Kiwi Tequila",
  real: true,
  requiredSecrets: ["KIWI_API_KEY"],

  isConfigured() {
    return Boolean(process.env.KIWI_API_KEY);
  },

  async status() {
    if (!this.isConfigured()) {
      return {
        id: "kiwi",
        label: "Kiwi Tequila",
        state: "missing_credentials",
        real: true,
        requiredSecrets: ["KIWI_API_KEY"],
        message: "Set KIWI_API_KEY to activate.",
      };
    }
    // Lightweight ping — Tequila responds to /locations with a query.
    try {
      const base = process.env.KIWI_BASE_URL ?? DEFAULT_BASE_URL;
      const url = new URL(`${base}/locations/query`);
      url.searchParams.set("term", "GRU");
      url.searchParams.set("location_types", "airport");
      url.searchParams.set("limit", "1");
      const res = await fetch(url, {
        headers: { apikey: process.env.KIWI_API_KEY!, accept: "application/json" },
      });
      if (res.status === 401 || res.status === 403) {
        return { id: "kiwi", label: "Kiwi Tequila", state: "error", real: true, message: "API key rejected." };
      }
      if (!res.ok) {
        return { id: "kiwi", label: "Kiwi Tequila", state: "error", real: true, message: `Upstream HTTP ${res.status}.` };
      }
      return { id: "kiwi", label: "Kiwi Tequila", state: "connected", real: true };
    } catch (e) {
      return { id: "kiwi", label: "Kiwi Tequila", state: "error", real: true, message: (e as Error).message };
    }
  },


  async search(params: FlightSearchParams): Promise<FlightSearchResult> {
    const apiKey = process.env.KIWI_API_KEY;
    if (!apiKey) {
      throw new ProviderError("kiwi", "not_configured", "KIWI_API_KEY not set");
    }
    const base = process.env.KIWI_BASE_URL ?? DEFAULT_BASE_URL;
    const url = new URL(`${base}/v2/search`);
    url.searchParams.set("fly_from", params.origin);
    url.searchParams.set("fly_to", params.destination);
    url.searchParams.set("date_from", toTequilaDate(params.departDate));
    url.searchParams.set("date_to", toTequilaDate(params.departDate));
    if (params.returnDate) {
      url.searchParams.set("return_from", toTequilaDate(params.returnDate));
      url.searchParams.set("return_to", toTequilaDate(params.returnDate));
    }
    url.searchParams.set("adults", String(params.passengers));
    url.searchParams.set("selected_cabins", cabinToTequila(params.cabin));
    url.searchParams.set("curr", params.currency ?? "BRL");
    url.searchParams.set("limit", String(params.limit ?? 20));
    url.searchParams.set("sort", "price");
    if (process.env.KIWI_AFFILIATE_ID) {
      url.searchParams.set("partner", process.env.KIWI_AFFILIATE_ID);
    }

    let res: Response;
    try {
      res = await fetch(url, { headers: { apikey: apiKey, accept: "application/json" } });
    } catch (e) {
      throw new ProviderError("kiwi", "upstream_error", (e as Error).message);
    }
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("kiwi", "unauthorized", "KIWI_API_KEY rejected by Tequila");
    }
    if (res.status === 429) {
      throw new ProviderError("kiwi", "rate_limited", "Tequila rate limit exceeded");
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError("kiwi", "upstream_error", `HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const payload = (await res.json()) as TequilaResponse;
    const currency = payload.currency ?? params.currency ?? "BRL";
    const offers = (payload.data ?? []).map((o) => mapOffer(o, params, currency));

    // Feed the deals intelligence layer. Fire-and-forget: the search
    // response must not depend on the write completing.
    await recordObservations(offers, params);

    return {
      provider: "kiwi",
      searchedAt: new Date().toISOString(),
      params,
      currency,
      offers,
    };
  },
};

export const KIWI_BASE_URL = DEFAULT_BASE_URL;
