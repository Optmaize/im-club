import { PointRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const originConfig: Record<string, { label: string; className: string }> = {
  atendimento: { label: "Atendimento", className: "bg-blue-100 text-blue-700 border-blue-200" },
  boas_vindas: { label: "Boas-vindas", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  indicacao: { label: "Indicação", className: "bg-amber-100 text-amber-700 border-amber-200" },
  manual: { label: "Bônus", className: "bg-purple-100 text-purple-700 border-purple-200" },
};

function getStatus(p: PointRecord): { label: string; className: string } {
  if (p.utilizado) return { label: "usado", className: "text-muted-foreground" };
  if (p.expira_em && new Date(p.expira_em) < new Date())
    return { label: "expirado", className: "text-red-500" };
  return { label: "ativo", className: "text-emerald-600" };
}

export function PointsTimeline({ points }: { points: PointRecord[] }) {
  if (points.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum ponto registrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {points.map((p, i) => {
        const origin = originConfig[p.origem ?? "manual"] ?? originConfig.manual;
        const status = getStatus(p);
        const active = !p.utilizado && !(p.expira_em && new Date(p.expira_em) < new Date());

        return (
          <div
            key={p.id}
            className={cn(
              "flex items-start gap-3 py-4",
              i < points.length - 1 && "border-b border-beige"
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
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={cn("text-sm font-semibold", active ? "text-ink" : "text-muted-foreground")}>
                    +{p.pontos} pontos
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {origin.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(p.criado_em), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <Badge variant="outline" className={cn("text-xs", origin.className)}>
                    {origin.label}
                  </Badge>
                  <span className={cn("text-[11px] font-medium", status.className)}>
                    {status.label}
                  </span>
                </div>
              </div>
              {p.expira_em && active && (
                <p className="text-xs text-muted-foreground mt-1">
                  Expira em{" "}
                  {format(new Date(p.expira_em), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
