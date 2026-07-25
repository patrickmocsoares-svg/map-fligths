/**
 * Flight search — shared types.
 *
 * These types are the stable contract between the UI, the service layer and
 * any provider adapter (mock, Amadeus, Duffel, Kiwi, an internal aggregator,
 * etc). Providers translate their native payloads INTO these shapes; the UI
 * only ever consumes these shapes.
 */

export type CabinClass = "economy" | "premium" | "business" | "first";

export type FlightSearchParams = {
  /** Origin airport IATA (3 letters) */
  origin: string;
  /** Destination airport IATA (3 letters) */
  destination: string;
  /** Departure date, ISO `YYYY-MM-DD` */
  departDate: string;
  /** Return date, ISO `YYYY-MM-DD`. Omit for one-way. */
  returnDate?: string;
  /** Total passenger count (adults for now). */
  passengers: number;
  /** Cabin class requested. */
  cabin: CabinClass;
  /** ISO 4217 currency, defaults to BRL. */
  currency?: string;
  /** Optional soft cap on how many offers to return. */
  limit?: number;
};

export type FlightSegment = {
  /** Marketing carrier IATA (e.g. `LA`, `AA`). */
  airlineCode: string;
  airlineName: string;
  /** Flight number without airline prefix, e.g. `8084`. */
  flightNumber: string;
  originCode: string;
  destinationCode: string;
  /** ISO 8601 datetime with timezone offset when known. */
  departureTime: string;
  arrivalTime: string;
  /** Segment duration in minutes. */
  durationMin: number;
  /** Aircraft type (IATA/ICAO or free-form). Optional. */
  aircraft?: string;
  cabin?: CabinClass;
};

export type FlightItinerary = {
  /** Total itinerary duration in minutes (all segments + layovers). */
  durationMin: number;
  /** 0 = direct, N = number of layovers. */
  stops: number;
  segments: FlightSegment[];
};

export type FlightOffer = {
  /** Provider-stable identifier for this offer. */
  id: string;
  /** Which adapter produced this offer. */
  provider: string;
  /** Convenience fields duplicated at the top level for quick UI use. */
  airline: {
    code: string;
    name: string;
  };
  /** First segment of the outbound as a convenient shortcut. */
  flightNumber: string;
  departureTime: string;
  arrivalTime: string;
  durationMin: number;
  stops: number;

  /** Full itinerary breakdown. `return` present only for round-trips. */
  outbound: FlightItinerary;
  return?: FlightItinerary;

  /** Total price for all passengers. */
  price: number;
  /** ISO 4217 currency. */
  currency: string;
  cabin: CabinClass;

  /** Optional: mileage/points alternative. */
  miles?: number;



};

export type FlightSearchResult = {
  /** Which adapter produced the result set. */
  provider: string;
  /** ISO datetime the search was executed. */
  searchedAt: string;
  /** The normalized parameters actually used. */
  params: FlightSearchParams;
  /** Currency of all offer prices. */
  currency: string;
  offers: FlightOffer[];
};
