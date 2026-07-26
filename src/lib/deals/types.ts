/**
 * Real-deal shape consumed by public UI.
 *
 * Populated exclusively from live Travelpayouts responses (never mock).
 * When Travelpayouts has no cached price for a destination, the card falls
 * back to `editorial: true` and hides every monetary field — the user is
 * never shown a fabricated price.
 */
export type RealDeal = {
  id: string;
  originCode: string;
  destinationCode: string;
  destinationCity: string;
  destinationCountry: string;
  airlineCode?: string;
  departDate?: string;
  returnDate?: string;
  /** Cheapest observed price for this route (BRL). Absent → editorial. */
  price?: number;
  /** Rough recent average across the cache sample for that route. */
  avgPrice?: number;
  currency: string;
  stops?: number;
  durationMin?: number;
  category: "domestic" | "international";
  editorial: boolean;
  foundAt: string;
};

export type NearbyDate = {
  date: string;
  price: number;
  currency: string;
};
