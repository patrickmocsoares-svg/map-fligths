/**
 * Curated destination photography by IATA code.
 * Uses Unsplash CDN with fixed photo IDs (stable, no attribution URL needed
 * for CDN delivery, safe cache). Fallback: a generic aviation shot.
 */

const BY_CODE: Record<string, string> = {
  // Brazil
  SSA: "1544551763-46a013bb70d5", // Salvador coast
  GIG: "1483729558449-99ef09a8c325", // Rio – Christ
  SDU: "1483729558449-99ef09a8c325", // Rio
  REC: "1518659526054-190b9a0c74a1", // Recife
  FOR: "1519046904884-53103b34b206", // Fortaleza beach
  FLN: "1533105079780-92b9be482077", // Floripa
  MAO: "1516426122078-c23e76319801", // Amazon
  BSB: "1541185933-ef5d8ed016c2", // Brasilia
  CNF: "1541185933-ef5d8ed016c2",
  POA: "1533105079780-92b9be482077",
  GRU: "1436491865332-7a61a109cc05",
  CGH: "1436491865332-7a61a109cc05",
  // Americas
  MIA: "1506966953602-c20cc11f75e3", // Miami
  JFK: "1496442226666-8d4d0e62e6e9", // NYC
  LAX: "1503891450247-ee5f8ec46dc3", // LA
  MEX: "1518105779142-d975f22f1b0a", // CDMX
  EZE: "1589909202802-8f4aadce1849", // Buenos Aires
  SCL: "1547140023-4a4f57f11326", // Santiago Andes
  BOG: "1580758354004-4a1a7b6b3d13", // Bogota
  // Europe
  LIS: "1585208798174-6cedd86e019a", // Lisboa tram
  MAD: "1543832923-44667a44c804",   // Madrid
  CDG: "1522093007474-d86e9bf7ba6f", // Paris
  FCO: "1552832230-c0197dd311b5",   // Roma
  LHR: "1513635269975-59663e0ac1ad", // London
  // Middle East / Asia
  DXB: "1512453979798-5ea266f8880c", // Dubai skyline
};

const FALLBACK = "1436491865332-7a61a109cc05";

export function destinationImage(code: string, w = 800, h = 1000): string {
  const id = BY_CODE[code?.toUpperCase?.()] ?? FALLBACK;
  return `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&auto=format&fit=crop&q=80`;
}

export function heroImage(w = 2000): string {
  return `https://images.unsplash.com/photo-1488085061387-422e29b40080?w=${w}&auto=format&fit=crop&q=80`;
}
