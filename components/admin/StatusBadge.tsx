import { Badge } from "@/components/ui/badge";
import { MemberStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusConfig: Record<MemberStatus, { label: string; className: string }> = {
  ativo: {
    label: "Ativo",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  pendente: {
    label: "Pendente",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  recusado: {
    label: "Recusado",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

export function StatusBadge({ status }: { status: MemberStatus }) {
  const config = statusConfig[status] ?? statusConfig.pendente;
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}
