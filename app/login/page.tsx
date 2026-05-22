"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IMClubLogo } from "@/components/shared/IMClubLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

    setSent(true);
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-beige flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg border-0 bg-white">
          <CardContent className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-gold" />
              </div>
            </div>
            <h2 className="font-playfair text-xl font-bold text-ink">Link enviado!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Enviamos um link de acesso para{" "}
              <span className="font-medium text-ink">{email}</span>.
              <br />
              Verifique sua caixa de entrada e clique no link para entrar.
            </p>
            <p className="text-xs text-muted-foreground">
              Não recebeu?{" "}
              <button
                onClick={() => setSent(false)}
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

        <CardContent className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-ink hover:bg-ink-light text-gold font-medium h-11 gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {loading ? "Enviando..." : "Enviar link de acesso"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Você receberá um link por email para entrar sem precisar de senha.
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
