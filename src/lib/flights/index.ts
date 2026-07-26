/**
 * Flight search service — public entry point.
 *
 * Selection order:
 *   1. `FLIGHT_PROVIDER` env override, if that provider is configured.
 *   2. First real, configured upstream provider (Duffel → Kiwi → Amadeus).
 *   3. Development synthetic provider (fallback so the app is never broken).
 *
 * The realistic dev provider stays as a strict fallback. When any real
 * upstream is configured via secrets, real prices replace fake ones
 * without any UI change — every result funnels through the neutral
 * `FlightOffer` shape and feeds price_history, MAB Score and deal
 * discovery automatically.
 *
 * The service is pure server code — call it from a `createServerFn` handler
 * (see `src/lib/flights.functions.ts`), never directly from browser code.
 */
import { mockProvider } from "./providers/mock";
import { devProvider } from "./providers/dev";
import { kiwiProvider } from "./providers/kiwi";
import { amadeusProvider } from "./providers/amadeus";
import { duffelProvider } from "./providers/duffel";
import { travelpayoutsProvider } from "./providers/travelpayouts";
import { ProviderError, type FlightProvider, type ProviderStatus } from "./provider";
import type { FlightSearchParams, FlightSearchResult } from "./types";

// Order matters for auto-selection. Real upstreams first; dev is the
// fallback and mock is kept only for fixture-driven local demos.
// Travelpayouts is prioritized as our currently-live affiliate partner —
// prices are indicative (cache) and confirmed by the partner at checkout.
const REGISTRY: FlightProvider[] = [
  duffelProvider,
  kiwiProvider,
  amadeusProvider,
  travelpayoutsProvider,
  devProvider,
  mockProvider,
];

const providers: Record<string, FlightProvider> = Object.fromEntries(
  REGISTRY.map((p) => [p.id, p]),
);

function pickProvider(): FlightProvider {
  const requested = process.env.FLIGHT_PROVIDER;
  if (requested && providers[requested]?.isConfigured()) return providers[requested];
  const real = REGISTRY.find((p) => p.real && p.isConfigured());
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
  try {
    return await provider.search(p);
  } catch (err) {
    // If a real upstream fails mid-request, keep the app usable by falling
    // back to synthetic offers rather than surfacing an empty results page.
    if (provider.real) {
      console.error(`[flights] real provider ${provider.id} failed, falling back to dev:`, err);
      return devProvider.search(p);
    }
    throw err;
  }
}

/**
 * Snapshot of every registered provider's health. Safe to expose to
 * authenticated admin UIs — never returns secret values.
 */
export type FlightProvidersStatus = {
  active: string;
  providers: ProviderStatus[];
};

export async function getFlightProvidersStatus(): Promise<FlightProvidersStatus> {
  const statuses = await Promise.all(
    REGISTRY.map(async (p) => {
      try {
        return await p.status();
      } catch (e) {
        return {
          id: p.id,
          label: p.label,
          state: "error" as const,
          real: p.real,
          requiredSecrets: p.requiredSecrets,
          message: (e as Error).message,
        };
      }
    }),
  );
  return { active: pickProvider().id, providers: statuses };
}

export { ProviderError };
export type { FlightProvider, ProviderStatus };
export type {
  CabinClass,
  FlightOffer,
  FlightSearchParams,
  FlightSearchResult,
  FlightSegment,
  FlightItinerary,
} from "./types";
