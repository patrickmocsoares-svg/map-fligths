/**
 * MAB miles pricing engine (pure, isomorphic).
 *
 * Business rules (all parameters configurable in /admin/configuracoes):
 *
 *   milesRequired = realPrice / mileValueRef      // fare value converted to miles
 *   milesCost     = milesRequired * costPerMile   // what the miles cost us
 *   clientPrice   = milesCost + markup + airportTax
 *   savings       = realPrice - clientPrice
 *
 * Everything produced here is an ESTIMATE. The final quote is always
 * confirmed by the MAB team before payment.
 */

export type MilesSettings = {
  costPerMile: number;
  mileValueRef: number;
  markupFixed: number;
  airportTax: number;
  whatsappNumber: string;
  businessHours: string;
  contactEmail: string;
};

export const DEFAULT_MILES_SETTINGS: MilesSettings = {
  costPerMile: 0.025,
  mileValueRef: 0.05,
  markupFixed: 150,
  airportTax: 38,
  whatsappNumber: "553120940901",
  businessHours: "Seg a Sáb, 8h às 20h (horário de Brasília)",
  contactEmail: "contato@mabflights.com",
};

export type MilesQuote = {
  realPrice: number;
  milesRequired: number;
  milesCost: number;
  markup: number;
  airportTax: number;
  clientPrice: number;
  savings: number;
  savingsPct: number;
  /** true when the miles route is not cheaper than the cash fare */
  noSaving: boolean;
};

export function quoteMiles(
  realPrice: number,
  s: MilesSettings = DEFAULT_MILES_SETTINGS,
): MilesQuote {
  const price = Math.max(0, Number(realPrice) || 0);
  const ref = s.mileValueRef > 0 ? s.mileValueRef : DEFAULT_MILES_SETTINGS.mileValueRef;
  const milesRequired = Math.round(price / ref);
  const milesCost = milesRequired * s.costPerMile;
  const clientPrice = Math.round(milesCost + s.markupFixed + s.airportTax);
  const savings = Math.round(price - clientPrice);
  return {
    realPrice: price,
    milesRequired,
    milesCost: Math.round(milesCost),
    markup: s.markupFixed,
    airportTax: s.airportTax,
    clientPrice,
    savings,
    savingsPct: price > 0 ? Math.round((savings / price) * 1000) / 10 : 0,
    noSaving: savings <= 0,
  };
}
