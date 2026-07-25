/**
 * Amadeus Self-Service — Flight Offers Search adapter (STUB).
 *
 * This file exists as the reference implementation for wiring a real
 * upstream provider. It is intentionally not active until credentials are
 * provisioned via `add_secret` (AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET).
 *
 * When activated:
 *  1. `isConfigured()` returns true.
 *  2. `search()` obtains an OAuth token from
 *     `https://test.api.amadeus.com/v1/security/oauth2/token`.
 *  3. Calls `GET /v2/shopping/flight-offers` and MAPS the response into
 *     `FlightSearchResult` — the UI never sees the raw Amadeus shape.
 *
 * Any other provider (Duffel, Kiwi, aggregator) follows the same pattern:
 * copy this file, rename, implement `search()`, register in `../index.ts`.
 */
import type { FlightSearchParams, FlightSearchResult } from "../types";
import { ProviderError, type FlightProvider } from "../provider";

const BASE_URL = "https://test.api.amadeus.com";

export const amadeusProvider: FlightProvider = {
  id: "amadeus",

  isConfigured() {
    return Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  },

  async search(_params: FlightSearchParams): Promise<FlightSearchResult> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        "amadeus",
        "not_configured",
        "AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET not set",
      );
    }
    // Intentional: activate this branch when credentials land.
    //
    // const token = await fetchToken();
    // const url = new URL(`${BASE_URL}/v2/shopping/flight-offers`);
    // url.searchParams.set("originLocationCode", _params.origin);
    // url.searchParams.set("destinationLocationCode", _params.destination);
    // url.searchParams.set("departureDate", _params.departDate);
    // if (_params.returnDate) url.searchParams.set("returnDate", _params.returnDate);
    // url.searchParams.set("adults", String(_params.passengers));
    // url.searchParams.set("travelClass", cabinToAmadeus(_params.cabin));
    // url.searchParams.set("currencyCode", _params.currency ?? "BRL");
    // const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    // if (!res.ok) throw new ProviderError("amadeus", "upstream_error", await res.text());
    // return mapAmadeusResponse(await res.json(), _params);

    throw new ProviderError("amadeus", "upstream_error", "adapter not implemented yet");
  },
};

// Reserved for the activation step — keep here so the URL and env contract are
// documented in one place.
export const AMADEUS_BASE_URL = BASE_URL;
