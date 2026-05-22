"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IMClubLogo } from "@/components/shared/IMClubLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ClienteHeader({ nome }: { nome: string }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Até logo!");
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between px-5 py-4 bg-ink sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <IMClubLogo size={32} />
        <div>
          <p className="text-xs text-white/40 leading-none">IM Club</p>
          <p className="text-sm text-gold font-medium leading-tight">Olá, {nome.split(" ")[0]}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="w-8 h-8 bg-gold/20">
          <AvatarFallback className="bg-gold/20 text-gold text-xs font-bold">
            {getInitials(nome)}
          </AvatarFallback>
        </Avatar>
        <button
          onClick={handleLogout}
          className="text-white/40 hover:text-white transition-colors p-1"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
