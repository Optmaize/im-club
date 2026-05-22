import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, Star } from "lucide-react";
import { AdminMetrics } from "@/lib/types";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function MetricsCards({ metrics }: { metrics: AdminMetrics }) {
  const cards = [
    {
      label: "Membros Ativos",
      value: metrics.totalAtivos.toString(),
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Pendentes",
      value: metrics.totalPendentes.toString(),
      icon: Users,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Crédito em Circulação",
      value: formatCurrency(metrics.totalCredito),
      icon: DollarSign,
      color: "text-gold",
      bg: "bg-gold/10",
    },
    {
      label: "Pontos Ativos",
      value: metrics.totalPontos.toLocaleString("pt-BR"),
      icon: Star,
      color: "text-ink",
      bg: "bg-ink/5",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <Card key={label} className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">
                  {label}
                </p>
                <p className="text-2xl font-bold text-ink font-playfair">
                  {value}
                </p>
              </div>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
