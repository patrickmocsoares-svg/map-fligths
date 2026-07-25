/**
 * Flight search service — public entry point.
 *
 * Picks an adapter based on the `FLIGHT_PROVIDER` env var (defaults to
 * `"mock"` in development). Add a new provider by dropping an adapter into
 * `./providers/` and registering it in the `providers` map below.
 *
 * The service is pure server code — call it from a `createServerFn` handler
 * (see `src/lib/flights.functions.ts`), never directly from browser code.
 */
import { mockProvider } from "./providers/mock";
import { amadeusProvider } from "./providers/amadeus";
import { ProviderError, type FlightProvider } from "./provider";
import type { FlightSearchParams, FlightSearchResult } from "./types";

const providers: Record<string, FlightProvider> = {
  mock: mockProvider,
  amadeus: amadeusProvider,
};

function pickProvider(): FlightProvider {
  const requested = process.env.FLIGHT_PROVIDER;
  if (requested && providers[requested]?.isConfigured()) return providers[requested];
  // Fall back to any configured real provider, then mock as last resort.
  const real = Object.values(providers).find((p) => p.id !== "mock" && p.isConfigured());
  return real ?? mockProvider;
}

function normalize(params: FlightSearchParams): FlightSearchParams {
  const iata = (s: string) => s.trim().toUpperCase();
  return {
    ...params,
    origin: iata(params.origin),
    destination: iata(params.destination),
    passengers: Math.max(1, Math.min(9, Math.floor(params.passengers || 1))),
    currency: params.currency ?? "BRL",
    limit: params.limit ?? 20,
  };
}

export async function searchFlights(
  params: FlightSearchParams,
): Promise<FlightSearchResult> {
  const p = normalize(params);
  if (!/^[A-Z]{3}$/.test(p.origin) || !/^[A-Z]{3}$/.test(p.destination)) {
    throw new ProviderError("service", "invalid_params", "origin/destination must be IATA codes");
  }
  if (p.origin === p.destination) {
    throw new ProviderError("service", "invalid_params", "origin equals destination");
  }
  const provider = pickProvider();
  return provider.search(p);
}

export { ProviderError };
export type { FlightProvider };
export type {
  CabinClass,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResult,
  FlightSegment,
  FlightItinerary,
} from "./types";
