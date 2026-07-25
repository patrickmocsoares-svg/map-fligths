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

export type ProviderState = "connected" | "missing_credentials" | "error" | "disabled";

export type ProviderStatus = {
  id: string;
  label: string;
  state: ProviderState;
  /** Human-readable detail — safe to surface in admin UIs. Never includes secrets. */
  message?: string;
  /** True for real upstream providers; false for dev/mock fallbacks. */
  real: boolean;
  /** Names of the env secrets this provider needs, for admin UX. */
  requiredSecrets?: string[];
};

export interface FlightProvider {
  /** Stable identifier, e.g. `"mock"`, `"amadeus"`, `"duffel"`. */
  readonly id: string;
  /** Human-readable name, e.g. `"Duffel"`. */
  readonly label: string;
  /** True for real upstream providers; false for dev/mock fallbacks. */
  readonly real: boolean;
  /** Env secrets required for `isConfigured()` to succeed. */
  readonly requiredSecrets?: string[];
  /** Whether this provider has enough config (env, secrets) to run. */
  isConfigured(): boolean;
  /** Lightweight health probe. Must never throw. */
  status(): Promise<ProviderStatus>;
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
