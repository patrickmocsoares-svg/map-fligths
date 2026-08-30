import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, Plane } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso restrito — TRIPmoc" },
      {
        name: "description",
        content: "Área de acesso da equipe TRIPmoc para gestão de solicitações de emissão.",
      },
      { property: "og:title", content: "Acesso restrito — TRIPmoc" },
      { property: "og:description", content: "Área de acesso da equipe TRIPmoc." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        if (!data.session) {
          setInfo("Conta criada. Confirme o e-mail enviado para concluir o acesso.");
        } else {
          navigate({ to: "/admin" });
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field =
    "w-full rounded-xl border border-border bg-background/60 px-4 py-3 text-[15px] outline-none transition-colors focus:border-border";

  return (
    <div className="grid min-h-screen place-items-center px-5 py-14">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center justify-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-cta text-primary-foreground shadow-luxe">
            <Plane className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg tracking-tight">TRIPmoc</span>
        </Link>

        <div className="mt-8 rounded-3xl border border-border bg-card/50 p-6 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-brand">
            <Lock className="h-3 w-3" /> Área restrita
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">
            {mode === "signin" ? "Entrar" : "Criar acesso"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Painel administrativo de solicitações e cotações em milhas.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                E-mail
              </span>
              <input
                className={field}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                Senha
              </span>
              <input
                className={field}
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error ? (
              <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            ) : null}
            {info ? (
              <p className="rounded-xl border border-border bg-accent px-3 py-2 text-xs text-brand-soft">
                {info}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cta px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-luxe disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signin" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="mt-5 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "signin" ? "Não tem acesso? Criar conta" : "Já tenho acesso — entrar"}
          </button>
        </div>

        <Link
          to="/"
          className="mt-6 block text-center text-xs text-muted-foreground hover:text-foreground"
        >
          Voltar ao site
        </Link>
      </div>
    </div>
  );
}
