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
import { devProvider } from "./providers/dev";
import { kiwiProvider } from "./providers/kiwi";
import { amadeusProvider } from "./providers/amadeus";
import { ProviderError, type FlightProvider } from "./provider";
import type { FlightSearchParams, FlightSearchResult } from "./types";

// Order matters for auto-selection: real upstreams first (Kiwi is primary,
// Amadeus is kept as an optional future adapter), then the realistic dev
// provider that also feeds price_history for MAB Score + opportunities,
// then the fixture-backed mock as a last resort.
const providers: Record<string, FlightProvider> = {
  kiwi: kiwiProvider,
  amadeus: amadeusProvider,
  dev: devProvider,
  mock: mockProvider,
};

const REAL_PROVIDERS = new Set(["kiwi", "amadeus"]);

function pickProvider(): FlightProvider {
  const requested = process.env.FLIGHT_PROVIDER;
  if (requested && providers[requested]?.isConfigured()) return providers[requested];
  // Prefer any configured real provider, otherwise use the realistic dev
  // provider so the app is fully functional without any API keys.
  const real = Object.values(providers).find(
    (p) => REAL_PROVIDERS.has(p.id) && p.isConfigured(),
  );
  return real ?? devProvider;
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
