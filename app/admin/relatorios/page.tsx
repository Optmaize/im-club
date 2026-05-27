import { createClient } from "@/lib/supabase/server";
import {
  getMembersNeverUsedCredit,
  getMembersWithExpiringPoints,
} from "@/lib/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MemberStatus } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, CreditCard } from "lucide-react";
import { ExportCSVButton } from "@/components/admin/ExportCSVButton";

export const revalidate = 300;

export default async function RelatoriosPage() {
  const supabase = await createClient();
  const [neverUsed, expiring] = await Promise.all([
    getMembersNeverUsedCredit(supabase),
    getMembersWithExpiringPoints(supabase, 30),
  ]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-ink">Relatórios</h1>
        <p className="text-muted-foreground text-sm">Insights sobre o programa de fidelidade</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CreditCard className="w-4 h-4 text-muted-foreground shrink-0" />
              <CardTitle className="font-playfair text-base text-ink">
                Membros que Nunca Usaram Crédito
              </CardTitle>
            </div>
            <ExportCSVButton
              data={neverUsed}
              filename="membros-sem-uso-credito"
              columns={["cliente_nome", "cliente_id", "tipo", "status", "criado_em"]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {neverUsed.length} membro{neverUsed.length !== 1 ? "s" : ""} ativo{neverUsed.length !== 1 ? "s" : ""} nunca resgatou crédito
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {neverUsed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Todos os membros já usaram seu crédito!
              </p>
            ) : (
              neverUsed.map((m) => (
                <div
                  key={m.cliente_id}
                  className="flex items-center justify-between py-3 border-b border-beige last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{m.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">{m.cliente_id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={(m.status ?? "pendente") as MemberStatus} />
                    <p className="text-xs text-muted-foreground">
                      desde {format(new Date(m.criado_em), "MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <CardTitle className="font-playfair text-base text-ink">
                Pontos Expirando em 30 Dias
              </CardTitle>
            </div>
            <ExportCSVButton
              data={expiring.map((e) => ({ ...e.member, pontosExpirando: e.pontosExpirando }))}
              filename="pontos-expirando"
              columns={["nome", "celular", "pontosExpirando"]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {expiring.length} membro{expiring.length !== 1 ? "s" : ""} com pontos prestes a expirar
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-0">
            {expiring.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum ponto expirando nos próximos 30 dias.
              </p>
            ) : (
              expiring.map(({ member: m, pontosExpirando }) => (
                <div
                  key={m.cliente_id}
                  className="flex items-center justify-between py-3 border-b border-beige last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{m.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">{m.cliente_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-600">
                      {pontosExpirando} pts
                    </p>
                    <p className="text-xs text-muted-foreground">expirando em breve</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
