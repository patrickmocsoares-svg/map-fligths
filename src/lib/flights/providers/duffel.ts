/**
 * Duffel API adapter — production-ready real flight provider.
 *
 * Docs: https://duffel.com/docs/api
 *
 * Activation:
 *   DUFFEL_ACCESS_TOKEN   - required. Live or test token from Duffel dashboard.
 *   DUFFEL_API_VERSION    - optional. Defaults to "v2".
 *   DUFFEL_BASE_URL       - optional. Defaults to https://api.duffel.com
 *
 * When active, every real search result is mapped into the neutral
 * `FlightOffer` shape and written to `price_history` so the MAB Score,
 * deal discovery and analytics layers keep working with real data — the
 * UI does not change.
 */
import type {
  CabinClass,
  FlightItinerary,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResult,
  FlightSegment,
} from "../types";
import { ProviderError, type FlightProvider, type ProviderStatus } from "../provider";

const DEFAULT_BASE_URL = "https://api.duffel.com";
const DEFAULT_VERSION = "v2";

function cabinToDuffel(c: CabinClass): "economy" | "premium_economy" | "business" | "first" {
  return c === "premium" ? "premium_economy" : c;
}

function duffelCabinToUs(v: string | undefined): CabinClass {
  switch ((v ?? "").toLowerCase()) {
    case "premium_economy":
      return "premium";
    case "business":
      return "business";
    case "first":
      return "first";
    default:
      return "economy";
  }
}

type DuffelSegment = {
  id: string;
  origin: { iata_code: string };
  destination: { iata_code: string };
  departing_at: string;
  arriving_at: string;
  duration: string; // ISO-8601 duration, e.g. PT8H15M
  marketing_carrier: { iata_code: string; name: string };
  marketing_carrier_flight_number: string;
  aircraft?: { iata_code?: string; name?: string } | null;
  passengers?: { cabin_class?: string }[];
};

type DuffelSlice = {
  origin: { iata_code: string };
  destination: { iata_code: string };
  duration: string;
  segments: DuffelSegment[];
};

type DuffelOffer = {
  id: string;
  total_amount: string;
  total_currency: string;
  slices: DuffelSlice[];
  owner?: { iata_code?: string; name?: string };
};

type DuffelOfferRequestResponse = {
  data: { id: string; offers?: DuffelOffer[] };
};

function isoDurationToMinutes(iso: string): number {
  // Supports PT#H#M#S
  const m = /^P(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(iso ?? "");
  if (!m) return 0;
  const h = Number(m[1] ?? 0);
  const min = Number(m[2] ?? 0);
  const s = Number(m[3] ?? 0);
  return h * 60 + min + Math.round(s / 60);
}

function mapSlice(slice: DuffelSlice, fallbackCabin: CabinClass): FlightItinerary {
  const segments: FlightSegment[] = slice.segments.map((s) => ({
    airlineCode: s.marketing_carrier.iata_code,
    airlineName: s.marketing_carrier.name,
    flightNumber: s.marketing_carrier_flight_number,
    originCode: s.origin.iata_code,
    destinationCode: s.destination.iata_code,
    departureTime: s.departing_at,
    arrivalTime: s.arriving_at,
    durationMin: isoDurationToMinutes(s.duration),
    aircraft: s.aircraft?.name ?? s.aircraft?.iata_code ?? undefined,
    cabin: duffelCabinToUs(s.passengers?.[0]?.cabin_class) ?? fallbackCabin,
  }));
  return {
    durationMin: isoDurationToMinutes(slice.duration),
    stops: Math.max(0, segments.length - 1),
    segments,
  };
}

function mapOffer(raw: DuffelOffer, params: FlightSearchParams): FlightOffer {
  const outbound = mapSlice(raw.slices[0], params.cabin);
  const ret = raw.slices[1] ? mapSlice(raw.slices[1], params.cabin) : undefined;
  const head = outbound.segments[0];
  const tail = outbound.segments[outbound.segments.length - 1];
  const airline = raw.owner ?? {
    iata_code: head?.airlineCode ?? "",
    name: head?.airlineName ?? "",
  };
  return {
    id: `duffel:${raw.id}`,
    provider: "duffel",
    airline: {
      code: airline.iata_code ?? head?.airlineCode ?? "",
      name: airline.name ?? head?.airlineName ?? "",
    },
    flightNumber: head?.flightNumber ?? "",
    departureTime: head?.departureTime ?? "",
    arrivalTime: tail?.arrivalTime ?? "",
    durationMin: outbound.durationMin,
    stops: outbound.stops,
    outbound,
    return: ret,
    price: Number(raw.total_amount),
    currency: raw.total_currency,
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
      source: "duffel",
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
    // Observability only — must never break search.
  }
}

function headers(): HeadersInit {
  const token = process.env.DUFFEL_ACCESS_TOKEN!;
  const version = process.env.DUFFEL_API_VERSION ?? DEFAULT_VERSION;
  return {
    Authorization: `Bearer ${token}`,
    "Duffel-Version": version,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export const duffelProvider: FlightProvider = {
  id: "duffel",
  label: "Duffel",
  real: true,
  requiredSecrets: ["DUFFEL_ACCESS_TOKEN"],

  isConfigured() {
    return Boolean(process.env.DUFFEL_ACCESS_TOKEN);
  },

  async status(): Promise<ProviderStatus> {
    if (!this.isConfigured()) {
      return {
        id: "duffel",
        label: "Duffel",
        state: "missing_credentials",
        real: true,
        requiredSecrets: ["DUFFEL_ACCESS_TOKEN"],
        message: "Set DUFFEL_ACCESS_TOKEN to activate.",
      };
    }
    try {
      const base = process.env.DUFFEL_BASE_URL ?? DEFAULT_BASE_URL;
      const res = await fetch(`${base}/air/airlines?limit=1`, { headers: headers() });
      if (res.status === 401 || res.status === 403) {
        return { id: "duffel", label: "Duffel", state: "error", real: true, message: "Access token rejected." };
      }
      if (!res.ok) {
        return { id: "duffel", label: "Duffel", state: "error", real: true, message: `Upstream HTTP ${res.status}.` };
      }
      return { id: "duffel", label: "Duffel", state: "connected", real: true };
    } catch (e) {
      return { id: "duffel", label: "Duffel", state: "error", real: true, message: (e as Error).message };
    }
  },

  async search(params: FlightSearchParams): Promise<FlightSearchResult> {
    if (!this.isConfigured()) {
      throw new ProviderError("duffel", "not_configured", "DUFFEL_ACCESS_TOKEN not set");
    }
    const base = process.env.DUFFEL_BASE_URL ?? DEFAULT_BASE_URL;
    const slices = [
      { origin: params.origin, destination: params.destination, departure_date: params.departDate },
    ];
    if (params.returnDate) {
      slices.push({
        origin: params.destination,
        destination: params.origin,
        departure_date: params.returnDate,
      });
    }
    const passengers = Array.from({ length: params.passengers }, () => ({ type: "adult" }));

    let res: Response;
    try {
      res = await fetch(`${base}/air/offer_requests?return_offers=true`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          data: {
            slices,
            passengers,
            cabin_class: cabinToDuffel(params.cabin),
          },
        }),
      });
    } catch (e) {
      throw new ProviderError("duffel", "upstream_error", (e as Error).message);
    }
    if (res.status === 401 || res.status === 403) {
      throw new ProviderError("duffel", "unauthorized", "DUFFEL_ACCESS_TOKEN rejected");
    }
    if (res.status === 429) {
      throw new ProviderError("duffel", "rate_limited", "Duffel rate limit exceeded");
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new ProviderError("duffel", "upstream_error", `HTTP ${res.status}: ${body.slice(0, 200)}`);
    }
    const payload = (await res.json()) as DuffelOfferRequestResponse;
    const raw = payload.data.offers ?? [];
    const limit = params.limit ?? 20;
    const offers = raw.slice(0, limit).map((o) => mapOffer(o, params));
    const currency = offers[0]?.currency ?? params.currency ?? "BRL";

    await recordObservations(offers, params);

    return {
      provider: "duffel",
      searchedAt: new Date().toISOString(),
      params,
      currency,
      offers,
    };
  },
};

export const DUFFEL_BASE_URL = DEFAULT_BASE_URL;
