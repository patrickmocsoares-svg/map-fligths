import { type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LayoutDashboard, Settings, LogOut, ShieldAlert, Loader2, Plane } from "lucide-react";
import { isAdminFn } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  const check = useServerFn(isAdminFn);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const guard = useQuery({
    queryKey: ["is-admin"],
    queryFn: () => check(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (guard.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  if (guard.isError || !guard.data?.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center px-5">
        <div className="max-w-sm rounded-3xl border border-white/10 bg-card/50 p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-gold" />
          <h1 className="mt-4 font-display text-xl font-bold">Acesso não autorizado</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta não possui o papel de administrador. Peça a um administrador para liberar
            o acesso.
          </p>
          <button
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/12 px-5 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-gold/10 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg gold-gradient text-primary-foreground">
              <Plane className="h-3.5 w-3.5" strokeWidth={2.5} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-base tracking-tight">MAB Flights</span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-gold/70">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                    active
                      ? "bg-gold text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <n.icon className="h-3.5 w-3.5" /> {n.label}
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3.5 py-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">{children}</main>
    </div>
  );
}
