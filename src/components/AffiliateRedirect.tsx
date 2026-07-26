import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, X } from "lucide-react";
import type { FlightOffer, FlightSearchParams } from "@/lib/flights/types";
import { resolveAffiliateTarget } from "@/lib/affiliate";
import { trackAffiliateClick } from "@/lib/analytics/affiliate-clicks";

/**
 * Premium interstitial shown between the "Continuar compra" click and the
 * partner redirect. Preserves brand trust, fires analytics once, then opens
 * the affiliate URL in a new tab.
 */
export function AffiliateRedirect({
  open,
  offer,
  params,
  onClose,
}: {
  open: boolean;
  offer: FlightOffer;
  params: FlightSearchParams;
  onClose: () => void;
}) {
  const [countdown, setCountdown] = useState(3);
  const openedRef = useRef(false);

  const target = open ? resolveAffiliateTarget({ offer, params }) : null;

  useEffect(() => {
    if (!open) {
      setCountdown(3);
      openedRef.current = false;
      return;
    }
    if (!target) return;

    // Fire analytics exactly once per open.
    trackAffiliateClick({
      partner: target.partner,
      offer,
      params,
      subId: target.subId,
    });

    const id = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(id);
          if (!openedRef.current) {
            openedRef.current = true;
            window.open(target.url, "_blank", "noopener,noreferrer,sponsored");
          }
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [open, target, offer, params]);

  // Lock scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const openNow = () => {
    if (!target) return;
    if (!openedRef.current) {
      openedRef.current = true;
      window.open(target.url, "_blank", "noopener,noreferrer,sponsored");
    }
    setCountdown(0);
  };

  const partnerName = target?.partner.name ?? "parceiro";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Redirecionamento para parceiro"
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
    >
      <div className="absolute inset-0 bg-background/85 backdrop-blur-xl animate-fade" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-card/95 p-6 shadow-luxe animate-slide-up sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancelar"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-gold/40 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
          <Sparkles className="h-3 w-3" /> MAB Flights
        </div>

        <h2 className="mt-3 font-display text-2xl font-bold leading-tight sm:text-3xl">
          {target
            ? <>Direcionando você para <span className="text-gold-gradient">{partnerName}</span></>
            : "Parceiro indisponível"}
        </h2>

        <p className="mt-3 text-sm text-muted-foreground">
          {target ? (
            <>
              Você finalizará a reserva no site do parceiro oficial.
              Sua busca ({params.origin} → {params.destination}) e a
              oferta selecionada foram preservadas.
            </>
          ) : (
            <>Ainda não temos um parceiro ativo para essa oferta. Tente novamente em instantes.</>
          )}
        </p>

        {target && (
          <>
            <div className="mt-6 flex items-center justify-center">
              <div className="relative grid h-20 w-20 place-items-center rounded-full border border-gold/30 bg-gold/5">
                <div className="absolute inset-0 rounded-full border-t-2 border-gold animate-spin" />
                <span className="font-display text-3xl font-extrabold text-gold-gradient tabular-nums">
                  {countdown > 0 ? countdown : "→"}
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-2 text-[11px] text-muted-foreground">
              <div className="inline-flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-gold" />
                Link oficial rastreado · sem custo extra para você
              </div>
            </div>

            <button
              type="button"
              onClick={openNow}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl gold-gradient px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-luxe transition hover:opacity-95"
            >
              Abrir {partnerName} agora <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground transition"
            >
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}
