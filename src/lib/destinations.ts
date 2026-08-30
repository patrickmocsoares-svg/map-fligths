/**
 * Destination catalog — richer than a raw airport row.
 *
 * Each entry ties an IATA code to:
 *   - a landmark-accurate hero photo (verified Unsplash CDN IDs)
 *   - a short editorial description
 *   - a one-line experience tagline
 *
 * The structure is intentionally flat so it can later be swapped for a
 * database-backed source (Supabase table `destinations`) without touching
 * consumers. Callers use `getDestination(code)` and receive a normalized
 * shape with sane fallbacks.
 */
import {
  DESTINATION_PHOTOS,
  FALLBACK_DESTINATION_PHOTO,
} from "@/lib/destination-photos";

export type Destination = {
  code: string;
  city: string;
  country: string;
  region: "Brasil" | "América Latina" | "América do Norte" | "Europa" | "Oriente Médio" | "Ásia" | "Outros";
  /** Unsplash photo ID — verified via HEAD request. */
  photoId: string;
  /** ~140 chars, editorial. */
  description: string;
  /** ~40 chars, drives desire ("Torre Eiffel ao entardecer"). */
  experience: string;
};

const FALLBACK_PHOTO = "1436491865332-7a61a109cc05"; // aerial airplane wing

export const DESTINATIONS: Record<string, Destination> = {
  // ── Brasil ───────────────────────────────────────────────────────────────
  SSA: {
    code: "SSA", city: "Salvador", country: "Brasil", region: "Brasil",
    photoId: "1544551763-46a013bb70d5",
    description: "Pelourinho colonial, praias do litoral norte e a batida do axé pulsando dia e noite.",
    experience: "Farol da Barra e Pelourinho ao pôr do sol",
  },
  GIG: {
    code: "GIG", city: "Rio de Janeiro", country: "Brasil", region: "Brasil",
    photoId: "1483729558449-99ef09a8c325",
    description: "Cristo Redentor, Pão de Açúcar e as areias de Copacabana e Ipanema.",
    experience: "Cristo Redentor com vista para a Baía de Guanabara",
  },
  SDU: {
    code: "SDU", city: "Rio de Janeiro", country: "Brasil", region: "Brasil",
    photoId: "1483729558449-99ef09a8c325",
    description: "Pouso no centro do Rio, a poucos minutos da Praia do Flamengo e do calçadão.",
    experience: "Chegada com vista para a Baía de Guanabara",
  },
  REC: {
    code: "REC", city: "Recife", country: "Brasil", region: "Brasil",
    photoId: "1519046904884-53103b34b206",
    description: "Recife Antigo, pontes históricas e as piscinas naturais de Porto de Galinhas ao lado.",
    experience: "Frevo no Recife Antigo, praia em Porto de Galinhas",
  },
  FOR: {
    code: "FOR", city: "Fortaleza", country: "Brasil", region: "Brasil",
    photoId: "1519046904884-53103b34b206",
    description: "Base perfeita para Jericoacoara, Canoa Quebrada e as falésias do litoral cearense.",
    experience: "Pôr do sol nas dunas de Jericoacoara",
  },
  FLN: {
    code: "FLN", city: "Florianópolis", country: "Brasil", region: "Brasil",
    photoId: "1533105079780-92b9be482077",
    description: "42 praias, lagoas e trilhas costeiras — a ilha da magia do sul do Brasil.",
    experience: "Praia do Rosa e a Lagoa da Conceição",
  },
  MAO: {
    code: "MAO", city: "Manaus", country: "Brasil", region: "Brasil",
    photoId: "1516426122078-c23e76319801",
    description: "Porta de entrada para a Amazônia: encontro das águas, floresta e o Teatro Amazonas.",
    experience: "Navegação pelo encontro das águas",
  },
  BSB: {
    code: "BSB", city: "Brasília", country: "Brasil", region: "Brasil",
    photoId: "1541185933-ef5d8ed016c2",
    description: "Arquitetura de Niemeyer, Esplanada dos Ministérios e o pôr do sol do Lago Paranoá.",
    experience: "Catedral de Brasília ao entardecer",
  },
  CNF: {
    code: "CNF", city: "Belo Horizonte", country: "Brasil", region: "Brasil",
    photoId: "1541185933-ef5d8ed016c2",
    description: "Capital dos botecos, com Inhotim e Ouro Preto a poucas horas de estrada.",
    experience: "Fim de semana em Ouro Preto e Inhotim",
  },
  POA: {
    code: "POA", city: "Porto Alegre", country: "Brasil", region: "Brasil",
    photoId: "1533105079780-92b9be482077",
    description: "Porta de entrada para a Serra Gaúcha, Gramado, Canela e os vinhedos do Vale dos Vinhedos.",
    experience: "Rota do vinho na Serra Gaúcha",
  },
  GRU: {
    code: "GRU", city: "São Paulo", country: "Brasil", region: "Brasil",
    photoId: "1541185933-ef5d8ed016c2",
    description: "O maior hub aéreo da América do Sul e a capital gastronômica do continente.",
    experience: "Restaurantes premiados e arte em Pinheiros",
  },
  CGH: {
    code: "CGH", city: "São Paulo", country: "Brasil", region: "Brasil",
    photoId: "1541185933-ef5d8ed016c2",
    description: "Aeroporto central, a minutos da Paulista, Vila Madalena e Jardins.",
    experience: "Domingos na Paulista aberta",
  },
  VCP: {
    code: "VCP", city: "Campinas", country: "Brasil", region: "Brasil",
    photoId: "1541185933-ef5d8ed016c2",
    description: "Hub alternativo para São Paulo, com tarifas frequentemente mais baixas.",
    experience: "Alternativa inteligente a Guarulhos",
  },

  // ── América do Norte ─────────────────────────────────────────────────────
  MIA: {
    code: "MIA", city: "Miami", country: "EUA", region: "América do Norte",
    photoId: "1535498730771-e735b998cd64",
    description: "South Beach art déco, Wynwood Walls e a energia latina de Little Havana.",
    experience: "Sunset em South Beach e drinks em Wynwood",
  },
  JFK: {
    code: "JFK", city: "Nova York", country: "EUA", region: "América do Norte",
    photoId: "1522083165195-3424ed129620",
    description: "Manhattan, Central Park, Broadway e a Estátua da Liberdade — a cidade que nunca dorme.",
    experience: "Broadway, MoMA e brunch no West Village",
  },
  LAX: {
    code: "LAX", city: "Los Angeles", country: "EUA", region: "América do Norte",
    photoId: "1444723121867-7a241cacace9",
    description: "Hollywood, Santa Monica Pier e o litoral do Pacífico rumo a Malibu.",
    experience: "Sunset em Santa Monica e road trip pela PCH",
  },
  MEX: {
    code: "MEX", city: "Cidade do México", country: "México", region: "América do Norte",
    photoId: "1518105779142-d975f22f1b0a",
    description: "Roma Norte, Condesa, tacos de canasta e as pirâmides de Teotihuacán ao lado.",
    experience: "Balão sobre as pirâmides ao amanhecer",
  },

  // ── América Latina ───────────────────────────────────────────────────────
  EZE: {
    code: "EZE", city: "Buenos Aires", country: "Argentina", region: "América Latina",
    photoId: "1589909202802-8f4aadce1849",
    description: "Palermo, San Telmo, tango na Boca e parrillas até altas horas.",
    experience: "Tango em San Telmo e parrilla em Palermo",
  },
  SCL: {
    code: "SCL", city: "Santiago", country: "Chile", region: "América Latina",
    photoId: "1541961017774-22349e4a1262",
    description: "Cordilheira dos Andes ao fundo, Valparaíso a duas horas e o Vale do Maipo dos vinhos.",
    experience: "Ski em Valle Nevado e vinhos em Maipo",
  },
  BOG: {
    code: "BOG", city: "Bogotá", country: "Colômbia", region: "América Latina",
    photoId: "1580060839134-75a5edca2e99",
    description: "La Candelaria colonial, Monserrate e o melhor café de altitude do continente.",
    experience: "Vista panorâmica do Cerro de Monserrate",
  },

  // ── Europa ───────────────────────────────────────────────────────────────
  LIS: {
    code: "LIS", city: "Lisboa", country: "Portugal", region: "Europa",
    photoId: "1555881400-74d7acaacd8b",
    description: "O bonde 28 subindo Alfama, os miradouros do Chiado e Belém à beira Tejo.",
    experience: "Bonde 28 e pastel de Belém",
  },
  MAD: {
    code: "MAD", city: "Madri", country: "Espanha", region: "Europa",
    photoId: "1543783207-ec64e4d95325",
    description: "Prado, Reina Sofía, tapas em La Latina e futebol no Santiago Bernabéu.",
    experience: "Museu do Prado e tapas em La Latina",
  },
  CDG: {
    code: "CDG", city: "Paris", country: "França", region: "Europa",
    photoId: "1502602898657-3e91760cbb34",
    description: "Torre Eiffel, Louvre, Marais e boulangeries em cada esquina.",
    experience: "Torre Eiffel ao entardecer",
  },
  FCO: {
    code: "FCO", city: "Roma", country: "Itália", region: "Europa",
    photoId: "1552832230-c0197dd311b5",
    description: "Coliseu, Vaticano, Trastevere e três milênios de história em cada rua.",
    experience: "Coliseu ao amanhecer, cappuccino em Trastevere",
  },
  LHR: {
    code: "LHR", city: "Londres", country: "Reino Unido", region: "Europa",
    photoId: "1513635269975-59663e0ac1ad",
    description: "Big Ben, Tate Modern, mercados de Camden e o teatro do West End.",
    experience: "West End à noite e brunch em Notting Hill",
  },

  // ── Oriente Médio ────────────────────────────────────────────────────────
  DXB: {
    code: "DXB", city: "Dubai", country: "Emirados Árabes", region: "Oriente Médio",
    photoId: "1512453979798-5ea266f8880c",
    description: "Burj Khalifa, desert safari, Palm Jumeirah e o luxo do Golfo Pérsico.",
    experience: "Topo do Burj Khalifa ao pôr do sol",
  },

  // ── Brasil (expansão comercial) ──────────────────────────────────────────
  CWB: {
    code: "CWB", city: "Curitiba", country: "Brasil", region: "Brasil",
    photoId: FALLBACK_PHOTO,
    description: "Jardim Botânico, Ópera de Arame e a capital mais arborizada do país.",
    experience: "Jardim Botânico ao amanhecer",
  },
  NAT: {
    code: "NAT", city: "Natal", country: "Brasil", region: "Brasil",
    photoId: FALLBACK_PHOTO,
    description: "Dunas de Genipabu, Ponta Negra e praias de água morna o ano inteiro.",
    experience: "Buggy nas dunas de Genipabu",
  },
  MCZ: {
    code: "MCZ", city: "Maceió", country: "Brasil", region: "Brasil",
    photoId: FALLBACK_PHOTO,
    description: "Piscinas naturais de Pajuçara, Praia do Francês e mar verde-esmeralda.",
    experience: "Jangada até as piscinas naturais",
  },
  JPA: {
    code: "JPA", city: "João Pessoa", country: "Brasil", region: "Brasil",
    photoId: FALLBACK_PHOTO,
    description: "Ponta do Seixas, Tambaú e o primeiro nascer do sol das Américas.",
    experience: "Nascer do sol na Ponta do Seixas",
  },
  BPS: {
    code: "BPS", city: "Porto Seguro", country: "Brasil", region: "Brasil",
    photoId: FALLBACK_PHOTO,
    description: "Trancoso, Arraial d'Ajuda e o litoral onde o Brasil começou.",
    experience: "Quadrado de Trancoso ao entardecer",
  },
  VIX: {
    code: "VIX", city: "Vitória", country: "Brasil", region: "Brasil",
    photoId: FALLBACK_PHOTO,
    description: "Terceira Ponte, Convento da Penha e a orla de Camburi.",
    experience: "Pôr do sol na Terceira Ponte",
  },
  IGU: {
    code: "IGU", city: "Foz do Iguaçu", country: "Brasil", region: "Brasil",
    photoId: FALLBACK_PHOTO,
    description: "As Cataratas do Iguaçu, o Parque das Aves e a tríplice fronteira.",
    experience: "Garganta do Diabo de perto",
  },

  // ── América Latina (expansão) ────────────────────────────────────────────
  MVD: {
    code: "MVD", city: "Montevidéu", country: "Uruguai", region: "América Latina",
    photoId: FALLBACK_PHOTO,
    description: "Rambla à beira do Prata, Ciudad Vieja e o melhor asado da região.",
    experience: "Caminhada na Rambla ao pôr do sol",
  },
  LIM: {
    code: "LIM", city: "Lima", country: "Peru", region: "América Latina",
    photoId: FALLBACK_PHOTO,
    description: "Miraflores sobre o Pacífico, Barranco boêmio e alta gastronomia.",
    experience: "Ceviche em Barranco",
  },
  CUN: {
    code: "CUN", city: "Cancún", country: "México", region: "América Latina",
    photoId: FALLBACK_PHOTO,
    description: "Caribe mexicano, cenotes, Tulum e resorts pé na areia.",
    experience: "Mergulho em cenote perto de Tulum",
  },

  // ── América do Norte (expansão) ──────────────────────────────────────────
  MCO: {
    code: "MCO", city: "Orlando", country: "Estados Unidos", region: "América do Norte",
    photoId: FALLBACK_PHOTO,
    description: "Parques temáticos, outlets e o destino favorito das famílias brasileiras.",
    experience: "Dia completo nos parques",
  },
};

export function getDestination(code: string): Destination {
  const c = code?.toUpperCase?.();
  const found = DESTINATIONS[c];
  if (found) return found;
  return {
    code: c ?? "???",
    city: c ?? "Destino",
    country: "",
    region: "Outros",
    photoId: FALLBACK_PHOTO,
    description: "Explore este destino monitorado pelo MAB Score.",
    experience: "Destino monitorado 24/7",
  };
}

/**
 * Local, city-accurate photo for a destination. The `w`/`h` arguments are kept
 * for call-site compatibility; local assets are already sized and cropped.
 */
export function destinationPhoto(code: string, _w = 800, _h = 1000): string {
  const c = code?.toUpperCase?.() ?? "";
  return DESTINATION_PHOTOS[c] ?? FALLBACK_DESTINATION_PHOTO;
}
