/**
 * Contact / concierge configuration.
 *
 * These are FALLBACKS. The live values (WhatsApp number, business hours,
 * contact e-mail) are managed in /admin/configuracoes and read through
 * `useSettings()`.
 */
export const WHATSAPP_NUMBER = "553120940901";

export function whatsappLink(message: string, number: string = WHATSAPP_NUMBER) {
  const digits = (number || WHATSAPP_NUMBER).replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const SUPPORT_HOURS = "Seg a Sáb, 8h às 20h (horário de Brasília)";

/** Message shown when a visitor asks about a specific listed offer. */
export function offerWhatsappMessage(args: {
  origin: string;
  destination: string;
  date: string;
  realPrice: string;
  milesPrice: string;
}) {
  return `Olá! Vi a oferta de ${args.origin} para ${args.destination} no dia ${args.date} por ${args.realPrice} ou ${args.milesPrice} em milhas. Gostaria de solicitar a emissão.`;
}
