import { createClient } from "@/lib/supabase/server";
import {
  getAdminMetrics,
  getMembersPerMonth,
  getRecentAttendances,
} from "@/lib/queries";
import { MetricsCards } from "@/components/admin/MetricsCards";
import { MembersChart } from "@/components/admin/MembersChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const [metrics, monthlyData, recentAttendances] = await Promise.all([
    getAdminMetrics(supabase),
    getMembersPerMonth(supabase),
    getRecentAttendances(supabase, 10),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Visão geral do IM Club</p>
      </div>

      <MetricsCards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MembersChart data={monthlyData} />

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="font-playfair text-base font-semibold text-ink">
              Últimos Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {recentAttendances.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Nenhum atendimento registrado
                </p>
              )}
              {recentAttendances.map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center py-3 border-b border-beige last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {a.cliente_nome ?? a.cliente_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.processado_em
                        ? format(new Date(a.processado_em), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-ink">
                      {a.valor != null ? formatCurrency(a.valor) : "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
