/**
 * Server-only WhatsApp notification for new quote requests.
 *
 * Never called from the browser: the customer stays on the site and the
 * message is delivered to the TRIPmoc business number by the backend.
 *
 * Supported transports (first configured wins):
 *  1. Meta WhatsApp Cloud API  -> WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID
 *  2. Generic webhook (Evolution API, n8n, Zapier, Make…) -> WHATSAPP_WEBHOOK_URL
 *
 * The destination number comes from WHATSAPP_BUSINESS_NUMBER (fallback: the
 * centralised number used by the site).
 */

export type OrderNotification = {
  id: string;
  protocol: string;
  fullName: string;
  phone: string;
  email: string;
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  passengers: string;
  notes?: string;
  createdAt: string;
};

const FALLBACK_NUMBER = "553120940901";

function formatDateTime(iso: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "America/Sao_Paulo",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function buildOrderMessage(n: OrderNotification) {
  return [
    "✈️ NOVA SOLICITAÇÃO DE ORÇAMENTO — TRIPmoc",
    "",
    `👤 Cliente: ${n.fullName}`,
    `📱 WhatsApp: ${n.phone}`,
    `📧 E-mail: ${n.email}`,
    `✈️ Origem: ${n.origin}`,
    `🎯 Destino: ${n.destination}`,
    `📅 Ida: ${n.departDate}`,
    `📅 Volta: ${n.returnDate ?? "Somente ida"}`,
    `👥 Passageiros: ${n.passengers}`,
    "",
    "📝 Observações:",
    n.notes && n.notes.trim().length > 0 ? n.notes : "—",
    "",
    `🕐 Recebida em: ${formatDateTime(n.createdAt)}`,
    `🔖 ID: ${n.protocol} (${n.id})`,
    "",
    "TRIPmoc — Nova solicitação aguardando análise.",
  ].join("\n");
}

/** Best-effort: never throws — the order is already persisted. */
export async function notifyBusinessWhatsApp(n: OrderNotification): Promise<{
  sent: boolean;
  transport: "cloud-api" | "webhook" | "none";
  error?: string;
}> {
  const message = buildOrderMessage(n);
  const to = (process.env["WHATSAPP_BUSINESS_NUMBER"] || FALLBACK_NUMBER).replace(/\D/g, "");

  const token = process.env["WHATSAPP_TOKEN"];
  const phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"];
  const webhookUrl = process.env["WHATSAPP_WEBHOOK_URL"];

  try {
    if (token && phoneNumberId) {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to,
            type: "text",
            text: { preview_url: false, body: message },
          }),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        return { sent: false, transport: "cloud-api", error: `${res.status} ${body.slice(0, 300)}` };
      }
      return { sent: true, transport: "cloud-api" };
    }

    if (webhookUrl) {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const secret = process.env["WHATSAPP_WEBHOOK_SECRET"];
      if (secret) headers["Authorization"] = `Bearer ${secret}`;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ to, message, order: n }),
      });
      if (!res.ok) {
        const body = await res.text();
        return { sent: false, transport: "webhook", error: `${res.status} ${body.slice(0, 300)}` };
      }
      return { sent: true, transport: "webhook" };
    }

    return { sent: false, transport: "none", error: "WhatsApp transport not configured" };
  } catch (err) {
    return {
      sent: false,
      transport: token && phoneNumberId ? "cloud-api" : webhookUrl ? "webhook" : "none",
      error: err instanceof Error ? err.message : "unknown error",
    };
  }
}
