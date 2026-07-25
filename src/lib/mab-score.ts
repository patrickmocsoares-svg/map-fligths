/**
 * MAB Score — deal intelligence.
 *
 * Compares a current price against a historical benchmark (moving average,
 * min/p25, and optionally a previous observation) and produces:
 *   - a 0–100 score
 *   - a discrete label (excellent / good / normal)
 *   - percentage saved vs. average
 *   - absolute savings
 *   - a short-term trend (down / flat / up)
 *
 * The function is intentionally pure and data-source agnostic. Callers can
 * pass historical stats fetched from `price_history` (via the
 * `route_price_stats` SQL helper) OR fall back to any inline benchmark
 * (e.g. the `averagePriceBRL` on a mock `Deal`).
 */

export type ScoreLabel = "excellent" | "good" | "normal";
export type PriceTrend = "down" | "flat" | "up";

export type ScoreInput = {
  /** Current offer price. */
  price: number;
  /** Historical average across recent observations. */
  avgPrice: number;
  /** Historical minimum, if known. Improves "excellent" detection. */
  minPrice?: number;
  /** 25th-percentile, if known. Used as a tighter benchmark for "good". */
  p25Price?: number;
  /** Previous latest price for the same route, if known. Drives `trend`. */
  previousPrice?: number;
  /** Sample size backing the average. Low N reduces confidence. */
  samples?: number;
};

export type MabScore = {
  score: number;
  label: ScoreLabel;
  discountPct: number;
  savings: number;
  trend: PriceTrend;
  /** 0–1: how confident we are in the score (samples + spread). */
  confidence: number;
};

export function computeMabScoreFromStats(input: ScoreInput): MabScore {
  const { price, avgPrice, minPrice, p25Price, previousPrice, samples = 1 } = input;
  const safeAvg = avgPrice > 0 ? avgPrice : price;
  const discountPct = Math.max(0, Math.round(((safeAvg - price) / safeAvg) * 100));
  const savings = Math.max(0, Math.round(safeAvg - price));

  // Base score from discount vs. average
  let score = Math.min(100, Math.round(discountPct * 1.8 + 20));

  // Bonus when price is at/below the historical minimum or p25 band
  if (minPrice != null && price <= minPrice * 1.02) score = Math.min(100, score + 10);
  else if (p25Price != null && price <= p25Price) score = Math.min(100, score + 5);

  let label: ScoreLabel = "normal";
  if (discountPct >= 35 || (minPrice != null && price <= minPrice * 1.05)) label = "excellent";
  else if (discountPct >= 15 || (p25Price != null && price <= p25Price)) label = "good";

  let trend: PriceTrend = "flat";
  if (previousPrice != null && previousPrice > 0) {
    const delta = (price - previousPrice) / previousPrice;
    if (delta <= -0.03) trend = "down";
    else if (delta >= 0.03) trend = "up";
  }

  const confidence = Math.min(1, Math.max(0.1, samples / 20));

  return { score, label, discountPct, savings, trend, confidence };
}

/** Back-compat shim for callers that only have `price` and an inline average. */
export function computeMabScore(
  deal: { priceBRL: number; averagePriceBRL: number } | ScoreInput,
): MabScore {
  if ("priceBRL" in deal) {
    return computeMabScoreFromStats({ price: deal.priceBRL, avgPrice: deal.averagePriceBRL });
  }
  return computeMabScoreFromStats(deal);
}

export function scoreLabelKey(l: ScoreLabel) {
  return l === "excellent" ? "score.excellent" : l === "good" ? "score.good" : "score.normal";
}

export function scoreColorClass(l: ScoreLabel) {
  return l === "excellent"
    ? "text-success border-success/40 bg-success/10"
    : l === "good"
      ? "text-gold border-gold/40 bg-gold/10"
      : "text-muted-foreground border-border bg-muted/40";
}

export function trendLabelKey(t: PriceTrend) {
  return t === "down" ? "trend.down" : t === "up" ? "trend.up" : "trend.flat";
}
