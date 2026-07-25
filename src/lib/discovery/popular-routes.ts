/**
 * Popular routes monitored by the MAB Opportunity Discovery Engine.
 *
 * These are the seed routes the scheduled discovery job sweeps to keep
 * `price_history` fresh across the four target markets. New routes can be
 * added here without any other change — the sweep enumerates them all.
 */
export type RouteRegion = "domestic" | "south_america" | "usa" | "europe";

export type PopularRoute = {
  origin: string;
  destination: string;
  region: RouteRegion;
};

/** Brazil-origin routes across the four target regions. */
export const POPULAR_ROUTES: PopularRoute[] = [
  // Domestic (Brazil)
  { origin: "GRU", destination: "GIG", region: "domestic" },
  { origin: "GRU", destination: "SSA", region: "domestic" },
  { origin: "GRU", destination: "REC", region: "domestic" },
  { origin: "GRU", destination: "FOR", region: "domestic" },
  { origin: "GRU", destination: "BSB", region: "domestic" },
  { origin: "GRU", destination: "POA", region: "domestic" },
  { origin: "GRU", destination: "CWB", region: "domestic" },
  { origin: "GRU", destination: "MAO", region: "domestic" },
  { origin: "GIG", destination: "SSA", region: "domestic" },
  { origin: "BSB", destination: "GRU", region: "domestic" },

  // South America
  { origin: "GRU", destination: "EZE", region: "south_america" },
  { origin: "GRU", destination: "SCL", region: "south_america" },
  { origin: "GRU", destination: "LIM", region: "south_america" },
  { origin: "GRU", destination: "BOG", region: "south_america" },
  { origin: "GRU", destination: "MVD", region: "south_america" },
  { origin: "GIG", destination: "EZE", region: "south_america" },

  // USA
  { origin: "GRU", destination: "MIA", region: "usa" },
  { origin: "GRU", destination: "JFK", region: "usa" },
  { origin: "GRU", destination: "MCO", region: "usa" },
  { origin: "GRU", destination: "LAX", region: "usa" },
  { origin: "GIG", destination: "MIA", region: "usa" },

  // Europe
  { origin: "GRU", destination: "LIS", region: "europe" },
  { origin: "GRU", destination: "MAD", region: "europe" },
  { origin: "GRU", destination: "CDG", region: "europe" },
  { origin: "GRU", destination: "FCO", region: "europe" },
  { origin: "GRU", destination: "LHR", region: "europe" },
  { origin: "GRU", destination: "FRA", region: "europe" },
  { origin: "GIG", destination: "LIS", region: "europe" },
];

/** Days ahead sampled for each route on every sweep. */
export const SWEEP_HORIZONS_DAYS = [21, 45, 75];
