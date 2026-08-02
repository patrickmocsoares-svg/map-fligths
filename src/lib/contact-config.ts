/**
 * Contact / concierge configuration.
 * Update WHATSAPP_NUMBER with the official MAB Flights number (E.164, digits only).
 */
export const WHATSAPP_NUMBER = "5511999999999";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export const SUPPORT_HOURS = "Seg a Sáb, 8h às 20h (horário de Brasília)";
