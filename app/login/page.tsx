"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendPasswordResetEmail } from "@/app/actions/auth";
import { IMClubLogo } from "@/components/shared/IMClubLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, CheckCircle, Eye, EyeOff, Link2 } from "lucide-react";

type Mode = "magic" | "password";
type View = "form" | "sent" | "forgot";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("password");
  const [view, setView] = useState<View>("form");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // ── Magic link ──────────────────────────────────────────────────────────────

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        shouldCreateUser: false,
      },
    });
    setLoading(false);
    if (error) {
      toast.error("Não foi possível enviar o link. Verifique o email informado.");
      return;
    }
    setView("sent");
  }

  // ── Email + senha ───────────────────────────────────────────────────────────

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Email ou senha incorretos.");
      return;
    }
    // Middleware will redirect to /admin or /minha-conta
    window.location.href = "/";
  }

  // ── Forgot password ─────────────────────────────────────────────────────────

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const result = await sendPasswordResetEmail(email);
    setLoading(false);
    if (result.error) {
      toast.error("Não foi possível enviar o email. Verifique o endereço informado.");
      return;
    }
    setView("sent");
  }

  // ── Sent confirmation ───────────────────────────────────────────────────────

  if (view === "sent") {
    const isForgot = view === "sent" && mode === "password";
    return (
      <main className="min-h-screen bg-beige flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0 bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-gold" />
              </div>
            </div>
            <h2 className="font-playfair text-xl font-bold text-ink">Email enviado!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enviamos um email para{" "}
              <span className="font-medium text-ink">{email}</span>.
              {isForgot
                ? " Clique no link para redefinir sua senha."
                : " Clique no link para entrar."}
            </p>
            <p className="text-xs text-muted-foreground">
              Não recebeu?{" "}
              <button
                onClick={() => setView("form")}
                className="text-gold hover:underline font-medium"
              >
                Tentar novamente
              </button>
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-beige flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <IMClubLogo size={56} />
          </div>
          <h1 className="font-playfair text-2xl font-bold text-ink">IM Club</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Programa de Fidelidade · Studio Isa Martina
          </p>
        </CardHeader>

        <CardContent className="p-8 pt-4 space-y-5">
          {/* Mode toggle */}
          <div className="flex bg-beige rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode("password"); setView("form"); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "password"
                  ? "bg-white text-ink shadow-sm"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Senha
            </button>
            <button
              onClick={() => { setMode("magic"); setView("form"); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === "magic"
                  ? "bg-white text-ink shadow-sm"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              Link mágico
            </button>
          </div>

          {/* ── Password login ── */}
          {mode === "password" && view === "form" && (
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-ink transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink-light text-gold font-medium h-11 gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                {loading ? "Entrando..." : "Entrar"}
              </Button>

              <button
                type="button"
                onClick={() => setView("forgot")}
                className="w-full text-xs text-center text-muted-foreground hover:text-gold transition-colors"
              >
                Esqueci minha senha
              </button>
            </form>
          )}

          {/* ── Forgot password ── */}
          {mode === "password" && view === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="bg-beige rounded-xl p-4 text-sm text-muted-foreground">
                Digite seu email e enviaremos um link para redefinir sua senha.
              </div>

              <div className="space-y-2">
                <Label htmlFor="email-reset">Email</Label>
                <Input
                  id="email-reset"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink-light text-gold font-medium h-11 gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {loading ? "Enviando..." : "Enviar link de redefinição"}
              </Button>

              <button
                type="button"
                onClick={() => setView("form")}
                className="w-full text-xs text-center text-muted-foreground hover:text-gold transition-colors"
              >
                ← Voltar para o login
              </button>
            </form>
          )}

          {/* ── Magic link ── */}
          {mode === "magic" && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-magic">Email</Label>
                <Input
                  id="email-magic"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink-light text-gold font-medium h-11 gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                {loading ? "Enviando..." : "Enviar link de acesso"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Você receberá um link por email para entrar sem precisar de senha.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
