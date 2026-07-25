import type { Deal } from "./mock-data";

export type MabScore = {
  score: number; // 0-100
  label: "excellent" | "good" | "normal";
  discountPct: number;
  savings: number;
};

export function computeMabScore(deal: Pick<Deal, "priceBRL" | "averagePriceBRL">): MabScore {
  const { priceBRL, averagePriceBRL } = deal;
  const discountPct = Math.max(0, Math.round(((averagePriceBRL - priceBRL) / averagePriceBRL) * 100));
  const savings = Math.max(0, averagePriceBRL - priceBRL);
  const score = Math.min(100, Math.round(discountPct * 1.8 + 20));
  let label: MabScore["label"] = "normal";
  if (discountPct >= 35) label = "excellent";
  else if (discountPct >= 15) label = "good";
  return { score, label, discountPct, savings };
}

export function scoreLabelKey(l: MabScore["label"]) {
  return l === "excellent" ? "score.excellent" : l === "good" ? "score.good" : "score.normal";
}

export function scoreColorClass(l: MabScore["label"]) {
  return l === "excellent"
    ? "text-success border-success/40 bg-success/10"
    : l === "good"
      ? "text-gold border-gold/40 bg-gold/10"
      : "text-muted-foreground border-border bg-muted/40";
}
