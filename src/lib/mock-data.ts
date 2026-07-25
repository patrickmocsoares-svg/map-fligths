export type Airport = {
  code: string;
  city: string;
  name: string;
  country: string;
};

export const AIRPORTS: Airport[] = [
  { code: "GRU", city: "São Paulo", name: "Guarulhos Intl.", country: "Brasil" },
  { code: "CGH", city: "São Paulo", name: "Congonhas", country: "Brasil" },
  { code: "GIG", city: "Rio de Janeiro", name: "Galeão", country: "Brasil" },
  { code: "SDU", city: "Rio de Janeiro", name: "Santos Dumont", country: "Brasil" },
  { code: "BSB", city: "Brasília", name: "Pres. Juscelino Kubitschek", country: "Brasil" },
  { code: "CNF", city: "Belo Horizonte", name: "Confins", country: "Brasil" },
  { code: "POA", city: "Porto Alegre", name: "Salgado Filho", country: "Brasil" },
  { code: "REC", city: "Recife", name: "Guararapes", country: "Brasil" },
  { code: "SSA", city: "Salvador", name: "Dep. Luís Eduardo Magalhães", country: "Brasil" },
  { code: "FOR", city: "Fortaleza", name: "Pinto Martins", country: "Brasil" },
  { code: "MAO", city: "Manaus", name: "Eduardo Gomes", country: "Brasil" },
  { code: "FLN", city: "Florianópolis", name: "Hercílio Luz", country: "Brasil" },
  { code: "MIA", city: "Miami", name: "Miami Intl.", country: "EUA" },
  { code: "JFK", city: "Nova York", name: "John F. Kennedy", country: "EUA" },
  { code: "LAX", city: "Los Angeles", name: "LAX", country: "EUA" },
  { code: "LIS", city: "Lisboa", name: "Humberto Delgado", country: "Portugal" },
  { code: "MAD", city: "Madri", name: "Barajas", country: "Espanha" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "França" },
  { code: "FCO", city: "Roma", name: "Fiumicino", country: "Itália" },
  { code: "LHR", city: "Londres", name: "Heathrow", country: "Reino Unido" },
  { code: "EZE", city: "Buenos Aires", name: "Ezeiza", country: "Argentina" },
  { code: "SCL", city: "Santiago", name: "A. Merino Benítez", country: "Chile" },
  { code: "BOG", city: "Bogotá", name: "El Dorado", country: "Colômbia" },
  { code: "MEX", city: "Cidade do México", name: "Benito Juárez", country: "México" },
  { code: "DXB", city: "Dubai", name: "Dubai Intl.", country: "Emirados Árabes" },
];

export type Airline = { code: string; name: string; color: string };
export const AIRLINES: Airline[] = [
  { code: "LA", name: "LATAM", color: "#E30613" },
  { code: "G3", name: "GOL", color: "#FF6B00" },
  { code: "AD", name: "Azul", color: "#00B4E5" },
  { code: "AA", name: "American Airlines", color: "#0078D2" },
  { code: "AF", name: "Air France", color: "#002157" },
  { code: "IB", name: "Iberia", color: "#D4A24C" },
  { code: "TP", name: "TAP Portugal", color: "#00693E" },
  { code: "EK", name: "Emirates", color: "#D71A21" },
];

export type Deal = {
  id: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
  departDate: string;
  returnDate?: string;
  priceBRL: number;
  averagePriceBRL: number;
  miles?: number;
  cabin: "economy" | "premium" | "business" | "first";
  stops: number;
  durationMin: number;
  category: "domestic" | "international" | "miles";
};

function airport(code: string) {
  return AIRPORTS.find((a) => a.code === code)!;
}
function airline(code: string) {
  return AIRLINES.find((a) => a.code === code)!;
}

const today = new Date();
function addDays(d: number) {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
}

export const DEALS: Deal[] = [
  // Domestic
  { id: "d1", airline: airline("LA"), origin: airport("GRU"), destination: airport("SSA"), departDate: addDays(21), returnDate: addDays(28), priceBRL: 489, averagePriceBRL: 980, cabin: "economy", stops: 0, durationMin: 165, category: "domestic" },
  { id: "d2", airline: airline("G3"), origin: airport("CGH"), destination: airport("SDU"), departDate: addDays(10), returnDate: addDays(13), priceBRL: 289, averagePriceBRL: 420, cabin: "economy", stops: 0, durationMin: 65, category: "domestic" },
  { id: "d3", airline: airline("AD"), origin: airport("BSB"), destination: airport("REC"), departDate: addDays(35), returnDate: addDays(42), priceBRL: 620, averagePriceBRL: 890, cabin: "economy", stops: 0, durationMin: 175, category: "domestic" },
  { id: "d4", airline: airline("LA"), origin: airport("GIG"), destination: airport("FOR"), departDate: addDays(18), returnDate: addDays(25), priceBRL: 545, averagePriceBRL: 720, cabin: "economy", stops: 0, durationMin: 195, category: "domestic" },
  { id: "d5", airline: airline("AD"), origin: airport("POA"), destination: airport("FLN"), departDate: addDays(14), priceBRL: 219, averagePriceBRL: 380, cabin: "economy", stops: 0, durationMin: 55, category: "domestic" },
  { id: "d6", airline: airline("G3"), origin: airport("CNF"), destination: airport("MAO"), departDate: addDays(30), returnDate: addDays(40), priceBRL: 890, averagePriceBRL: 1420, cabin: "economy", stops: 1, durationMin: 320, category: "domestic" },

  // International
  { id: "i1", airline: airline("LA"), origin: airport("GRU"), destination: airport("MIA"), departDate: addDays(45), returnDate: addDays(60), priceBRL: 3290, averagePriceBRL: 5800, cabin: "economy", stops: 0, durationMin: 505, category: "international" },
  { id: "i2", airline: airline("TP"), origin: airport("GRU"), destination: airport("LIS"), departDate: addDays(60), returnDate: addDays(75), priceBRL: 2890, averagePriceBRL: 4600, cabin: "economy", stops: 0, durationMin: 585, category: "international" },
  { id: "i3", airline: airline("AF"), origin: airport("GIG"), destination: airport("CDG"), departDate: addDays(50), returnDate: addDays(65), priceBRL: 3780, averagePriceBRL: 5200, cabin: "economy", stops: 0, durationMin: 665, category: "international" },
  { id: "i4", airline: airline("IB"), origin: airport("GRU"), destination: airport("MAD"), departDate: addDays(40), returnDate: addDays(55), priceBRL: 3150, averagePriceBRL: 4900, cabin: "economy", stops: 0, durationMin: 620, category: "international" },
  { id: "i5", airline: airline("AA"), origin: airport("GRU"), destination: airport("JFK"), departDate: addDays(70), returnDate: addDays(85), priceBRL: 4290, averagePriceBRL: 6100, cabin: "economy", stops: 0, durationMin: 590, category: "international" },
  { id: "i6", airline: airline("EK"), origin: airport("GRU"), destination: airport("DXB"), departDate: addDays(90), returnDate: addDays(105), priceBRL: 5490, averagePriceBRL: 7800, cabin: "economy", stops: 0, durationMin: 850, category: "international" },

  // Miles
  { id: "m1", airline: airline("LA"), origin: airport("GRU"), destination: airport("SCL"), departDate: addDays(28), returnDate: addDays(35), priceBRL: 2100, averagePriceBRL: 3200, miles: 22000, cabin: "economy", stops: 0, durationMin: 235, category: "miles" },
  { id: "m2", airline: airline("G3"), origin: airport("CGH"), destination: airport("GIG"), departDate: addDays(7), priceBRL: 340, averagePriceBRL: 520, miles: 8500, cabin: "economy", stops: 0, durationMin: 65, category: "miles" },
  { id: "m3", airline: airline("AD"), origin: airport("VCP"), destination: airport("REC"), departDate: addDays(20), returnDate: addDays(27), priceBRL: 780, averagePriceBRL: 1150, miles: 15000, cabin: "economy", stops: 0, durationMin: 180, category: "miles" },
  { id: "m4", airline: airline("LA"), origin: airport("GRU"), destination: airport("MIA"), departDate: addDays(65), returnDate: addDays(80), priceBRL: 3290, averagePriceBRL: 5800, miles: 60000, cabin: "business", stops: 0, durationMin: 505, category: "miles" },
].filter((d) => d.origin && d.destination) as Deal[];

export function priceHistory(deal: Deal): { date: string; price: number }[] {
  const out: { date: string; price: number }[] = [];
  const base = deal.averagePriceBRL;
  for (let i = 90; i >= 0; i -= 5) {
    const jitter = (Math.sin(i / 6) + Math.cos(i / 3)) * 0.15;
    const trend = (i / 90) * 0.1;
    out.push({
      date: addDays(-i),
      price: Math.round(base * (1 + jitter - trend)),
    });
  }
  out.push({ date: addDays(0), price: deal.priceBRL });
  return out;
}

export function findDeal(id: string): Deal | undefined {
  return DEALS.find((d) => d.id === id);
}
