/**
 * Flight provider adapter contract.
 *
 * A provider is anything that can turn a `FlightSearchParams` into a
 * `FlightSearchResult`: the built-in mock (used in development), or a real
 * upstream API (Amadeus, Duffel, Kiwi, an internal aggregator, etc).
 *
 * Rules for implementors:
 *  - Never leak provider-native shapes to the caller — always return
 *    `FlightOffer` objects.
 *  - Throw `ProviderError` for expected failures (auth, rate limit, invalid
 *    route). Unknown errors will surface as generic 500s server-side.
 *  - Providers are pure server-side. Do not import from browser-only modules.
 */
import type { FlightSearchParams, FlightSearchResult } from "./types";

export interface FlightProvider {
  /** Stable identifier, e.g. `"mock"`, `"amadeus"`, `"duffel"`. */
  readonly id: string;
  /** Whether this provider has enough config (env, secrets) to run. */
  isConfigured(): boolean;
  search(params: FlightSearchParams): Promise<FlightSearchResult>;
}

export class ProviderError extends Error {
  constructor(
    public readonly provider: string,
    public readonly code:
      | "not_configured"
      | "invalid_params"
      | "unauthorized"
      | "rate_limited"
      | "upstream_error"
      | "no_results",
    message: string,
  ) {
    super(`[${provider}] ${code}: ${message}`);
    this.name = "ProviderError";
  }
}
