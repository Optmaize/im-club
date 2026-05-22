import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { IMClubLogo } from "@/components/shared/IMClubLogo";
import { LogoutButton } from "@/components/cliente/LogoutButton";

export default async function AguardandoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen bg-beige flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-sm w-full space-y-8">
        <div className="flex justify-center">
          <IMClubLogo size={64} />
        </div>

        <div className="space-y-3">
          <h1 className="font-playfair text-2xl font-bold text-ink">
            Seu acesso está sendo preparado ✨
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Em breve a Isa confirmará sua participação no IM Club.
            Você receberá uma notificação por WhatsApp assim que seu acesso for liberado.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-2">
          <p className="text-xs text-muted-foreground">Sua conta</p>
          <p className="text-sm font-medium text-ink">{user.email}</p>
        </div>

        <LogoutButton />
      </div>
    </main>
  );
}
