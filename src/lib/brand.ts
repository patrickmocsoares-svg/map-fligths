/**
 * Single source of truth for the TRIPmoc brand.
 * Never hardcode the brand name in components — import from here.
 */
export const BRAND = {
  name: "TRIPmoc",
  subtitle: "PREMIUM TRAVEL",
  /** Slogan histórico, mantido como assinatura institucional. */
  slogan: "Transformando milhas em oportunidades.",
  /** Novo slogan comercial da marca. */
  tagline: "Menos tarifa. Mais viagem.",
  domain: "www.tripmoc.com.br",
  email: "contato@tripmoc.com.br",
  location: "Brasil",
} as const;

export const INDICATIVE_DISCLAIMER =
  "Preços indicativos. Sujeitos a disponibilidade, alterações de tarifa e condições de emissão.";
