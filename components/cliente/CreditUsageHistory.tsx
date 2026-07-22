import { CreditUsageRecord } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export function CreditUsageHistory({ usages }: { usages: CreditUsageRecord[] }) {
  if (usages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum crédito utilizado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {usages.map((u, i) => (
        <div
          key={u.id}
          className={cn(
            "flex items-start gap-3 py-4",
            i < usages.length - 1 && "border-b border-beige"
          )}
        >
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-muted" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">- {formatCurrency(u.valor)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {u.observacao ?? "Desconto aplicado no atendimento"}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(u.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
