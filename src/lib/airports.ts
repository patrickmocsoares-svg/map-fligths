/**
 * Airports data source.
 *
 * This module is designed as a swappable adapter so that in the future the
 * dataset can come from a real database or an external API (e.g. Amadeus,
 * OpenFlights, or a Supabase `airports` table) without touching the UI.
 *
 * To wire a real backend, replace `searchAirports` / `getAirportByCode` with
 * an async call (e.g. a `createServerFn` querying Postgres). The signatures
 * are already async and the UI debounces + handles loading states.
 */

export type Airport = {
  code: string; // IATA
  city: string;
  name: string;
  country: string;
  countryCode?: string;
  region?: string;
};

// A representative worldwide seed set. This is intentionally broad (not a
// small hardcoded list) and can be replaced by a full DB-backed dataset.
// Source: curated from public OpenFlights / Wikipedia data.
export const AIRPORTS_DB: Airport[] = [
  // Brasil
  { code: "GRU", city: "São Paulo", name: "Guarulhos International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "CGH", city: "São Paulo", name: "Congonhas", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "VCP", city: "Campinas", name: "Viracopos International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "GIG", city: "Rio de Janeiro", name: "Galeão – Antônio Carlos Jobim", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "SDU", city: "Rio de Janeiro", name: "Santos Dumont", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "BSB", city: "Brasília", name: "Presidente Juscelino Kubitschek", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "CNF", city: "Belo Horizonte", name: "Tancredo Neves International (Confins)", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "PLU", city: "Belo Horizonte", name: "Pampulha", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "POA", city: "Porto Alegre", name: "Salgado Filho International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "CWB", city: "Curitiba", name: "Afonso Pena International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "FLN", city: "Florianópolis", name: "Hercílio Luz International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "REC", city: "Recife", name: "Guararapes – Gilberto Freyre International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "SSA", city: "Salvador", name: "Deputado Luís Eduardo Magalhães International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "FOR", city: "Fortaleza", name: "Pinto Martins International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "NAT", city: "Natal", name: "Governador Aluízio Alves International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "MCZ", city: "Maceió", name: "Zumbi dos Palmares International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "AJU", city: "Aracaju", name: "Santa Maria International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "BEL", city: "Belém", name: "Val de Cans International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "MAO", city: "Manaus", name: "Eduardo Gomes International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "IGU", city: "Foz do Iguaçu", name: "Cataratas International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "VIX", city: "Vitória", name: "Eurico de Aguiar Salles", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "GYN", city: "Goiânia", name: "Santa Genoveva", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "CGB", city: "Cuiabá", name: "Marechal Rondon International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "CGR", city: "Campo Grande", name: "Campo Grande International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "SLZ", city: "São Luís", name: "Marechal Cunha Machado International", country: "Brasil", countryCode: "BR", region: "South America" },
  { code: "THE", city: "Teresina", name: "Senador Petrônio Portella", country: "Brasil", countryCode: "BR", region: "South America" },

  // América do Sul
  { code: "EZE", city: "Buenos Aires", name: "Ministro Pistarini (Ezeiza)", country: "Argentina", countryCode: "AR", region: "South America" },
  { code: "AEP", city: "Buenos Aires", name: "Jorge Newbery Airfield", country: "Argentina", countryCode: "AR", region: "South America" },
  { code: "MDZ", city: "Mendoza", name: "El Plumerillo", country: "Argentina", countryCode: "AR", region: "South America" },
  { code: "COR", city: "Córdoba", name: "Ingeniero Ambrosio Taravella", country: "Argentina", countryCode: "AR", region: "South America" },
  { code: "SCL", city: "Santiago", name: "Arturo Merino Benítez International", country: "Chile", countryCode: "CL", region: "South America" },
  { code: "LIM", city: "Lima", name: "Jorge Chávez International", country: "Peru", countryCode: "PE", region: "South America" },
  { code: "BOG", city: "Bogotá", name: "El Dorado International", country: "Colômbia", countryCode: "CO", region: "South America" },
  { code: "MDE", city: "Medellín", name: "José María Córdova International", country: "Colômbia", countryCode: "CO", region: "South America" },
  { code: "CTG", city: "Cartagena", name: "Rafael Núñez International", country: "Colômbia", countryCode: "CO", region: "South America" },
  { code: "UIO", city: "Quito", name: "Mariscal Sucre International", country: "Equador", countryCode: "EC", region: "South America" },
  { code: "GYE", city: "Guayaquil", name: "José Joaquín de Olmedo International", country: "Equador", countryCode: "EC", region: "South America" },
  { code: "CCS", city: "Caracas", name: "Simón Bolívar International", country: "Venezuela", countryCode: "VE", region: "South America" },
  { code: "MVD", city: "Montevidéu", name: "Carrasco International", country: "Uruguai", countryCode: "UY", region: "South America" },
  { code: "ASU", city: "Assunção", name: "Silvio Pettirossi International", country: "Paraguai", countryCode: "PY", region: "South America" },
  { code: "LPB", city: "La Paz", name: "El Alto International", country: "Bolívia", countryCode: "BO", region: "South America" },

  // América do Norte / Central / Caribe
  { code: "MIA", city: "Miami", name: "Miami International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "MCO", city: "Orlando", name: "Orlando International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "FLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "JFK", city: "Nova York", name: "John F. Kennedy International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "EWR", city: "Newark", name: "Newark Liberty International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "LGA", city: "Nova York", name: "LaGuardia", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "BOS", city: "Boston", name: "Logan International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "IAD", city: "Washington", name: "Dulles International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "DCA", city: "Washington", name: "Ronald Reagan National", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield–Jackson International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "ORD", city: "Chicago", name: "O'Hare International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "DEN", city: "Denver", name: "Denver International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "SFO", city: "São Francisco", name: "San Francisco International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "SEA", city: "Seattle", name: "Seattle–Tacoma International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "PHX", city: "Phoenix", name: "Sky Harbor International", country: "Estados Unidos", countryCode: "US", region: "North America" },
  { code: "YYZ", city: "Toronto", name: "Toronto Pearson International", country: "Canadá", countryCode: "CA", region: "North America" },
  { code: "YUL", city: "Montreal", name: "Pierre Elliott Trudeau International", country: "Canadá", countryCode: "CA", region: "North America" },
  { code: "YVR", city: "Vancouver", name: "Vancouver International", country: "Canadá", countryCode: "CA", region: "North America" },
  { code: "MEX", city: "Cidade do México", name: "Benito Juárez International", country: "México", countryCode: "MX", region: "North America" },
  { code: "CUN", city: "Cancún", name: "Cancún International", country: "México", countryCode: "MX", region: "North America" },
  { code: "GDL", city: "Guadalajara", name: "Miguel Hidalgo y Costilla International", country: "México", countryCode: "MX", region: "North America" },
  { code: "PTY", city: "Cidade do Panamá", name: "Tocumen International", country: "Panamá", countryCode: "PA", region: "Central America" },
  { code: "SJO", city: "San José", name: "Juan Santamaría International", country: "Costa Rica", countryCode: "CR", region: "Central America" },
  { code: "HAV", city: "Havana", name: "José Martí International", country: "Cuba", countryCode: "CU", region: "Caribbean" },
  { code: "PUJ", city: "Punta Cana", name: "Punta Cana International", country: "República Dominicana", countryCode: "DO", region: "Caribbean" },
  { code: "SDQ", city: "Santo Domingo", name: "Las Américas International", country: "República Dominicana", countryCode: "DO", region: "Caribbean" },
  { code: "NAS", city: "Nassau", name: "Lynden Pindling International", country: "Bahamas", countryCode: "BS", region: "Caribbean" },

  // Europa
  { code: "LIS", city: "Lisboa", name: "Humberto Delgado (Lisbon Airport)", country: "Portugal", countryCode: "PT", region: "Europe" },
  { code: "OPO", city: "Porto", name: "Francisco Sá Carneiro", country: "Portugal", countryCode: "PT", region: "Europe" },
  { code: "MAD", city: "Madri", name: "Adolfo Suárez Madrid–Barajas", country: "Espanha", countryCode: "ES", region: "Europe" },
  { code: "BCN", city: "Barcelona", name: "Josep Tarradellas Barcelona–El Prat", country: "Espanha", countryCode: "ES", region: "Europe" },
  { code: "AGP", city: "Málaga", name: "Málaga–Costa del Sol", country: "Espanha", countryCode: "ES", region: "Europe" },
  { code: "PMI", city: "Palma de Maiorca", name: "Palma de Mallorca", country: "Espanha", countryCode: "ES", region: "Europe" },
  { code: "LHR", city: "Londres", name: "Heathrow", country: "Reino Unido", countryCode: "GB", region: "Europe" },
  { code: "LGW", city: "Londres", name: "Gatwick", country: "Reino Unido", countryCode: "GB", region: "Europe" },
  { code: "STN", city: "Londres", name: "Stansted", country: "Reino Unido", countryCode: "GB", region: "Europe" },
  { code: "MAN", city: "Manchester", name: "Manchester Airport", country: "Reino Unido", countryCode: "GB", region: "Europe" },
  { code: "EDI", city: "Edimburgo", name: "Edinburgh Airport", country: "Reino Unido", countryCode: "GB", region: "Europe" },
  { code: "DUB", city: "Dublin", name: "Dublin Airport", country: "Irlanda", countryCode: "IE", region: "Europe" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle", country: "França", countryCode: "FR", region: "Europe" },
  { code: "ORY", city: "Paris", name: "Orly", country: "França", countryCode: "FR", region: "Europe" },
  { code: "NCE", city: "Nice", name: "Côte d'Azur", country: "França", countryCode: "FR", region: "Europe" },
  { code: "LYS", city: "Lyon", name: "Lyon–Saint-Exupéry", country: "França", countryCode: "FR", region: "Europe" },
  { code: "MRS", city: "Marselha", name: "Marseille Provence", country: "França", countryCode: "FR", region: "Europe" },
  { code: "FCO", city: "Roma", name: "Leonardo da Vinci–Fiumicino", country: "Itália", countryCode: "IT", region: "Europe" },
  { code: "MXP", city: "Milão", name: "Milano Malpensa", country: "Itália", countryCode: "IT", region: "Europe" },
  { code: "LIN", city: "Milão", name: "Linate", country: "Itália", countryCode: "IT", region: "Europe" },
  { code: "VCE", city: "Veneza", name: "Marco Polo", country: "Itália", countryCode: "IT", region: "Europe" },
  { code: "NAP", city: "Nápoles", name: "Napoli Capodichino", country: "Itália", countryCode: "IT", region: "Europe" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport", country: "Alemanha", countryCode: "DE", region: "Europe" },
  { code: "MUC", city: "Munique", name: "Munich Airport", country: "Alemanha", countryCode: "DE", region: "Europe" },
  { code: "BER", city: "Berlim", name: "Berlin Brandenburg", country: "Alemanha", countryCode: "DE", region: "Europe" },
  { code: "HAM", city: "Hamburgo", name: "Hamburg Airport", country: "Alemanha", countryCode: "DE", region: "Europe" },
  { code: "AMS", city: "Amsterdã", name: "Schiphol", country: "Países Baixos", countryCode: "NL", region: "Europe" },
  { code: "BRU", city: "Bruxelas", name: "Brussels Airport", country: "Bélgica", countryCode: "BE", region: "Europe" },
  { code: "ZRH", city: "Zurique", name: "Zurich Airport", country: "Suíça", countryCode: "CH", region: "Europe" },
  { code: "GVA", city: "Genebra", name: "Geneva Airport", country: "Suíça", countryCode: "CH", region: "Europe" },
  { code: "VIE", city: "Viena", name: "Vienna International", country: "Áustria", countryCode: "AT", region: "Europe" },
  { code: "CPH", city: "Copenhague", name: "Copenhagen Airport", country: "Dinamarca", countryCode: "DK", region: "Europe" },
  { code: "ARN", city: "Estocolmo", name: "Stockholm Arlanda", country: "Suécia", countryCode: "SE", region: "Europe" },
  { code: "OSL", city: "Oslo", name: "Oslo Gardermoen", country: "Noruega", countryCode: "NO", region: "Europe" },
  { code: "HEL", city: "Helsinki", name: "Helsinki-Vantaa", country: "Finlândia", countryCode: "FI", region: "Europe" },
  { code: "WAW", city: "Varsóvia", name: "Chopin Airport", country: "Polônia", countryCode: "PL", region: "Europe" },
  { code: "PRG", city: "Praga", name: "Václav Havel Airport", country: "República Tcheca", countryCode: "CZ", region: "Europe" },
  { code: "BUD", city: "Budapeste", name: "Ferenc Liszt International", country: "Hungria", countryCode: "HU", region: "Europe" },
  { code: "ATH", city: "Atenas", name: "Eleftherios Venizelos", country: "Grécia", countryCode: "GR", region: "Europe" },
  { code: "IST", city: "Istambul", name: "Istanbul Airport", country: "Turquia", countryCode: "TR", region: "Europe" },
  { code: "SAW", city: "Istambul", name: "Sabiha Gökçen", country: "Turquia", countryCode: "TR", region: "Europe" },
  { code: "SVO", city: "Moscou", name: "Sheremetyevo", country: "Rússia", countryCode: "RU", region: "Europe" },

  // Oriente Médio e África
  { code: "DXB", city: "Dubai", name: "Dubai International", country: "Emirados Árabes Unidos", countryCode: "AE", region: "Middle East" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed International", country: "Emirados Árabes Unidos", countryCode: "AE", region: "Middle East" },
  { code: "DOH", city: "Doha", name: "Hamad International", country: "Catar", countryCode: "QA", region: "Middle East" },
  { code: "TLV", city: "Tel Aviv", name: "Ben Gurion", country: "Israel", countryCode: "IL", region: "Middle East" },
  { code: "AMM", city: "Amã", name: "Queen Alia International", country: "Jordânia", countryCode: "JO", region: "Middle East" },
  { code: "RUH", city: "Riade", name: "King Khalid International", country: "Arábia Saudita", countryCode: "SA", region: "Middle East" },
  { code: "JED", city: "Jidá", name: "King Abdulaziz International", country: "Arábia Saudita", countryCode: "SA", region: "Middle East" },
  { code: "CAI", city: "Cairo", name: "Cairo International", country: "Egito", countryCode: "EG", region: "Africa" },
  { code: "JNB", city: "Joanesburgo", name: "O. R. Tambo International", country: "África do Sul", countryCode: "ZA", region: "Africa" },
  { code: "CPT", city: "Cidade do Cabo", name: "Cape Town International", country: "África do Sul", countryCode: "ZA", region: "Africa" },
  { code: "CMN", city: "Casablanca", name: "Mohammed V International", country: "Marrocos", countryCode: "MA", region: "Africa" },
  { code: "ADD", city: "Adis Abeba", name: "Bole International", country: "Etiópia", countryCode: "ET", region: "Africa" },
  { code: "NBO", city: "Nairóbi", name: "Jomo Kenyatta International", country: "Quênia", countryCode: "KE", region: "Africa" },
  { code: "LOS", city: "Lagos", name: "Murtala Muhammed International", country: "Nigéria", countryCode: "NG", region: "Africa" },

  // Ásia e Oceania
  { code: "HND", city: "Tóquio", name: "Haneda", country: "Japão", countryCode: "JP", region: "Asia" },
  { code: "NRT", city: "Tóquio", name: "Narita International", country: "Japão", countryCode: "JP", region: "Asia" },
  { code: "KIX", city: "Osaka", name: "Kansai International", country: "Japão", countryCode: "JP", region: "Asia" },
  { code: "ICN", city: "Seul", name: "Incheon International", country: "Coreia do Sul", countryCode: "KR", region: "Asia" },
  { code: "PEK", city: "Pequim", name: "Beijing Capital International", country: "China", countryCode: "CN", region: "Asia" },
  { code: "PKX", city: "Pequim", name: "Beijing Daxing International", country: "China", countryCode: "CN", region: "Asia" },
  { code: "PVG", city: "Xangai", name: "Shanghai Pudong International", country: "China", countryCode: "CN", region: "Asia" },
  { code: "CAN", city: "Cantão", name: "Guangzhou Baiyun International", country: "China", countryCode: "CN", region: "Asia" },
  { code: "HKG", city: "Hong Kong", name: "Hong Kong International", country: "China (Hong Kong)", countryCode: "HK", region: "Asia" },
  { code: "TPE", city: "Taipé", name: "Taiwan Taoyuan International", country: "Taiwan", countryCode: "TW", region: "Asia" },
  { code: "SIN", city: "Singapura", name: "Changi Airport", country: "Singapura", countryCode: "SG", region: "Asia" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport", country: "Tailândia", countryCode: "TH", region: "Asia" },
  { code: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International", country: "Malásia", countryCode: "MY", region: "Asia" },
  { code: "CGK", city: "Jacarta", name: "Soekarno–Hatta International", country: "Indonésia", countryCode: "ID", region: "Asia" },
  { code: "DPS", city: "Bali (Denpasar)", name: "Ngurah Rai International", country: "Indonésia", countryCode: "ID", region: "Asia" },
  { code: "MNL", city: "Manila", name: "Ninoy Aquino International", country: "Filipinas", countryCode: "PH", region: "Asia" },
  { code: "SGN", city: "Ho Chi Minh", name: "Tan Son Nhat International", country: "Vietnã", countryCode: "VN", region: "Asia" },
  { code: "HAN", city: "Hanói", name: "Noi Bai International", country: "Vietnã", countryCode: "VN", region: "Asia" },
  { code: "DEL", city: "Nova Déli", name: "Indira Gandhi International", country: "Índia", countryCode: "IN", region: "Asia" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International", country: "Índia", countryCode: "IN", region: "Asia" },
  { code: "BLR", city: "Bangalore", name: "Kempegowda International", country: "Índia", countryCode: "IN", region: "Asia" },
  { code: "MLE", city: "Malé", name: "Velana International", country: "Maldivas", countryCode: "MV", region: "Asia" },
  { code: "SYD", city: "Sydney", name: "Kingsford Smith", country: "Austrália", countryCode: "AU", region: "Oceania" },
  { code: "MEL", city: "Melbourne", name: "Melbourne Airport", country: "Austrália", countryCode: "AU", region: "Oceania" },
  { code: "BNE", city: "Brisbane", name: "Brisbane Airport", country: "Austrália", countryCode: "AU", region: "Oceania" },
  { code: "PER", city: "Perth", name: "Perth Airport", country: "Austrália", countryCode: "AU", region: "Oceania" },
  { code: "AKL", city: "Auckland", name: "Auckland Airport", country: "Nova Zelândia", countryCode: "NZ", region: "Oceania" },
];

/** Remove diacritics + lowercase for accent-insensitive matching. */
function norm(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Score a match. Higher = better. Returns -1 when no field matches.
 *  - exact IATA code match wins
 *  - prefix matches beat contains matches
 *  - city > name > country field priority
 */
function scoreAirport(a: Airport, q: string): number {
  if (!q) return 0;
  const nq = norm(q);
  const code = a.code.toLowerCase();
  const city = norm(a.city);
  const name = norm(a.name);
  const country = norm(a.country);

  if (code === nq) return 1000;
  if (code.startsWith(nq)) return 800;

  let score = -1;
  if (city.startsWith(nq)) score = Math.max(score, 700);
  else if (city.includes(nq)) score = Math.max(score, 500);

  if (name.startsWith(nq)) score = Math.max(score, 600);
  else if (name.includes(nq)) score = Math.max(score, 400);

  if (country.startsWith(nq)) score = Math.max(score, 350);
  else if (country.includes(nq)) score = Math.max(score, 200);

  return score;
}

/**
 * Search airports by city, name, IATA code, or country.
 * Async by design — swap the body for a fetch / server function later
 * without changing any call sites.
 */
export async function searchAirports(query: string, limit = 8): Promise<Airport[]> {
  const q = query.trim();
  if (!q) {
    // Return a popular default set when the field is empty (first N).
    return AIRPORTS_DB.slice(0, limit);
  }
  const scored: { a: Airport; s: number }[] = [];
  for (const a of AIRPORTS_DB) {
    const s = scoreAirport(a, q);
    if (s >= 0) scored.push({ a, s });
  }
  scored.sort((x, y) => y.s - x.s);
  return scored.slice(0, limit).map((x) => x.a);
}

export function getAirportByCode(code: string): Airport | undefined {
  const c = code.toUpperCase();
  return AIRPORTS_DB.find((a) => a.code === c);
}
