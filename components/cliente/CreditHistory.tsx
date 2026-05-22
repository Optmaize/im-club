import { CreditRecord } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function getStatus(c: CreditRecord): { label: string; className: string } {
  if (c.utilizado) return { label: "usado", className: "text-muted-foreground" };
  if (c.expira_em && new Date(c.expira_em) < new Date())
    return { label: "expirado", className: "text-red-500" };
  return { label: "disponível", className: "text-emerald-600" };
}

export function CreditHistory({ credits }: { credits: CreditRecord[] }) {
  if (credits.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum crédito registrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {credits.map((c, i) => {
        const status = getStatus(c);
        const active = !c.utilizado && !(c.expira_em && new Date(c.expira_em) < new Date());

        return (
          <div
            key={c.id}
            className={cn(
              "flex items-start gap-3 py-4",
              i < credits.length - 1 && "border-b border-beige"
            )}
          >
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                  active ? "bg-gold" : "bg-muted"
                )}
              />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn("text-sm font-semibold", active ? "text-ink" : "text-muted-foreground")}>
                    {formatCurrency(c.valor)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.origem ?? "Crédito de atendimento"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(c.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={cn("text-[11px] font-medium", status.className)}>
                    {status.label}
                  </span>
                  {c.expira_em && active && (
                    <span className="text-[11px] text-muted-foreground">
                      até {format(new Date(c.expira_em), "dd/MM/yy", { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
