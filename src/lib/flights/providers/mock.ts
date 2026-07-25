/**
 * Mock flight provider — development only.
 *
 * Backed by the local `DEALS` fixture so the UI has something to render
 * before a real provider is wired. Any real provider can be dropped in via
 * `src/lib/flights/index.ts` without changing UI code.
 */
import { DEALS } from "@/lib/mock-data";
import type { FlightOffer, FlightSearchParams, FlightSearchResult } from "../types";
import type { FlightProvider } from "../provider";

function buildOffer(dealIndex: number, params: FlightSearchParams): FlightOffer {
  const d = DEALS[dealIndex % DEALS.length];
  const dep = new Date(`${params.departDate}T09:15:00`);
  const arr = new Date(dep.getTime() + d.durationMin * 60_000);
  const flightNumber = `${1000 + ((dealIndex * 37) % 8999)}`;

  const outbound = {
    durationMin: d.durationMin,
    stops: d.stops,
    segments: [
      {
        airlineCode: d.airline.code,
        airlineName: d.airline.name,
        flightNumber,
        originCode: params.origin,
        destinationCode: params.destination,
        departureTime: dep.toISOString(),
        arrivalTime: arr.toISOString(),
        durationMin: d.durationMin,
        cabin: params.cabin,
      },
    ],
  };

  let ret: FlightOffer["return"];
  if (params.returnDate) {
    const rdep = new Date(`${params.returnDate}T18:40:00`);
    const rarr = new Date(rdep.getTime() + d.durationMin * 60_000);
    ret = {
      durationMin: d.durationMin,
      stops: d.stops,
      segments: [
        {
          airlineCode: d.airline.code,
          airlineName: d.airline.name,
          flightNumber: `${Number(flightNumber) + 1}`,
          originCode: params.destination,
          destinationCode: params.origin,
          departureTime: rdep.toISOString(),
          arrivalTime: rarr.toISOString(),
          durationMin: d.durationMin,
          cabin: params.cabin,
        },
      ],
    };
  }

  const cabinMult = { economy: 1, premium: 1.6, business: 3.1, first: 5.4 }[params.cabin];
  const price = Math.round(d.priceBRL * cabinMult * Math.max(1, params.passengers));

  return {
    id: `mock-${d.id}-${dealIndex}`,
    provider: "mock",
    airline: { code: d.airline.code, name: d.airline.name },
    flightNumber,
    departureTime: outbound.segments[0].departureTime,
    arrivalTime: outbound.segments[0].arrivalTime,
    durationMin: d.durationMin,
    stops: d.stops,
    outbound,
    return: ret,
    price,
    currency: params.currency ?? "BRL",
    cabin: params.cabin,
    miles: d.miles,
  };
}

export const mockProvider: FlightProvider = {
  id: "mock",
  isConfigured: () => true,
  async search(params) {
    const limit = params.limit ?? 12;
    const offers = Array.from({ length: Math.min(limit, DEALS.length) }, (_, i) =>
      buildOffer(i, params),
    );
    return {
      provider: "mock",
      searchedAt: new Date().toISOString(),
      params,
      currency: params.currency ?? "BRL",
      offers,
    } satisfies FlightSearchResult;
  },
};
