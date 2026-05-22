"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Star, DollarSign, Scissors, Users } from "lucide-react";

const navItems = [
  { href: "/minha-conta", label: "Início", icon: Home },
  { href: "/minha-conta/pontos", label: "Pontos", icon: Star },
  { href: "/minha-conta/credito", label: "Crédito", icon: DollarSign },
  { href: "/minha-conta/atendimentos", label: "Serviços", icon: Scissors },
  { href: "/minha-conta/indicacoes", label: "Indicações", icon: Users },
];

export function ClienteNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 bg-ink border-t border-white/10">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === "/minha-conta" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 py-3 px-1 transition-colors",
                active ? "text-gold" : "text-white/40 hover:text-white/70"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
