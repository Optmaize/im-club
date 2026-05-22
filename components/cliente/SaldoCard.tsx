import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SaldoCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  variant?: "gold" | "ink";
  alert?: string;
}

export function SaldoCard({
  label,
  value,
  subtitle,
  icon: Icon,
  variant = "gold",
  alert,
}: SaldoCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-5 flex flex-col gap-3",
        variant === "gold"
          ? "bg-ink text-white"
          : "bg-beige-dark text-ink border border-beige-dark"
      )}
    >
      <div className="flex items-center justify-between">
        <p className={cn("text-xs font-medium", variant === "gold" ? "text-white/60" : "text-muted-foreground")}>
          {label}
        </p>
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            variant === "gold" ? "bg-gold/20" : "bg-ink/10"
          )}
        >
          <Icon
            className={cn("w-4 h-4", variant === "gold" ? "text-gold" : "text-ink")}
          />
        </div>
      </div>
      <div>
        <p
          className={cn(
            "text-3xl font-bold font-playfair leading-none",
            variant === "gold" ? "text-gold" : "text-ink"
          )}
        >
          {value}
        </p>
        {subtitle && (
          <p className={cn("text-xs mt-1.5", variant === "gold" ? "text-white/50" : "text-muted-foreground")}>
            {subtitle}
          </p>
        )}
      </div>
      {alert && (
        <div className="bg-amber-500/20 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-200">{alert}</p>
        </div>
      )}
    </div>
  );
}
