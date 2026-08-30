import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Plane, X } from "lucide-react";
import { formatBRL } from "@/lib/i18n";
import { whatsappLink } from "@/lib/contact-config";
import { useSettings } from "@/hooks/useSettings";

export type SavingsContext = {
  origin: string;
  destination: string;
  date: string;
  price: number;
  currency?: string;
};

const DISMISS_KEY = "mab_savings_modal_dismissed";

/** Whether the auto-open (7s) modal may still be shown in this session. */
export function savingsModalAllowed() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) !== "1";
}

export function dismissSavingsModal() {
  try {
    window.localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

function formatDate(iso: string) {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export function WhatsAppSavingsModal({
  open,
  onClose,
  context,
}: {
  open: boolean;
  onClose: () => void;
  context: SavingsContext | null;
}) {
  const { settings } = useSettings();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !context || typeof document === "undefined") return null;

  const priceLabel =
    context.currency && context.currency !== "BRL"
      ? `${context.currency} ${context.price.toFixed(0)}`
      : formatBRL(context.price);

  const message = `Olá! Vi a passagem de ${context.origin} para ${context.destination} no dia ${formatDate(
    context.date,
  )} por ${priceLabel}. Gostaria de saber o valor em milhas. Pode me ajudar?`;

  const href = whatsappLink(message, settings.whatsappNumber);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Economize com milhas"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-rise relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-gold/20 bg-card p-7 shadow-luxe sm:max-w-[500px] sm:rounded-3xl sm:p-9"
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 rounded-full border border-border p-2 text-muted-foreground transition hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold/30 bg-gold/10">
          <Plane className="h-6 w-6 -rotate-45 text-gold" />
        </div>

        <h2 className="mt-5 text-center font-display text-2xl font-bold leading-tight sm:text-3xl">
          Economize até 40% com milhas
        </h2>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          Você viu o preço real de{" "}
          <span className="font-semibold text-foreground">{priceLabel}</span> para{" "}
          <span className="font-mono text-gold">{context.origin}</span> →{" "}
          <span className="font-mono text-gold">{context.destination}</span>.
        </p>

        <p className="mt-4 text-center text-sm leading-relaxed text-muted-foreground">
          Com milhas, você pode pagar muito menos. Nossa equipe confirma o melhor valor em
          minutos pelo WhatsApp. Atendimento humanizado e sem surpresas.
        </p>

        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            dismissSavingsModal();
            onClose();
          }}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-whatsapp px-6 py-4 text-sm font-bold uppercase tracking-wide text-whatsapp-foreground shadow-luxe transition hover:brightness-110 active:scale-[0.99]"
        >
          💬 Falar no WhatsApp agora
        </a>

        <button
          onClick={onClose}
          className="mt-3 w-full rounded-2xl border border-border px-6 py-3.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
        >
          Ver outras opções
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {settings.businessHours}
        </p>
      </div>
    </div>,
    document.body,
  );
}
