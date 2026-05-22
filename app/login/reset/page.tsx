"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { IMClubLogo } from "@/components/shared/IMClubLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/nova-senha`,
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao enviar email. Tente novamente.");
      return;
    }

    setSent(true);
  }

  return (
    <main className="min-h-screen bg-beige flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="flex justify-center mb-4">
            <IMClubLogo size={48} />
          </div>
          <h1 className="font-playfair text-xl font-bold text-ink">
            Recuperar senha
          </h1>
        </CardHeader>

        <CardContent className="p-8 pt-4">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-gold" />
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enviamos um link para <strong className="text-ink">{email}</strong>.
                <br />
                Clique no link para criar uma nova senha.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar ao login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <p className="text-sm text-muted-foreground">
                Digite seu email e enviaremos um link para criar uma nova senha.
              </p>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink-light text-gold font-medium h-11"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {loading ? "Enviando..." : "Enviar link"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Voltar ao login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
