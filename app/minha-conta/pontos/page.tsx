import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/queries";
import {
  fetchMemberPointsBalance,
  fetchMemberPoints,
  fetchExpiringPoints,
} from "@/app/actions/admin-queries";
import { SaldoCard } from "@/components/cliente/SaldoCard";
import { PointsTimeline } from "@/components/cliente/PointsTimeline";
import { Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function PontosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const member = await getMemberForUser(admin, user.id, user.email);
  if (!member) return null;

  const [saldo, points, expiring] = await Promise.all([
    fetchMemberPointsBalance(member.cliente_id),
    fetchMemberPoints(member.cliente_id),
    fetchExpiringPoints(member.cliente_id, 30),
  ]);

  const pontosExpirando = expiring.reduce((s, p) => s + p.pontos, 0);
  const proximaExpiracao = expiring[0]?.expira_em
    ? format(new Date(expiring[0].expira_em), "dd/MM/yyyy", { locale: ptBR })
    : null;

  return (
    <div className="p-5 space-y-5">
      <h1 className="font-playfair text-xl font-bold text-ink">Meus Pontos</h1>

      <SaldoCard
        label="Saldo de Pontos"
        value={saldo.toLocaleString("pt-BR")}
        subtitle="pontos disponíveis"
        icon={Star}
        variant="gold"
        alert={
          pontosExpirando > 0 && proximaExpiracao
            ? `Você tem ${pontosExpirando} pontos expirando em ${proximaExpiracao} — use antes que expirem!`
            : undefined
        }
      />

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-playfair text-base font-semibold text-ink mb-1">
          Histórico
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {points.length} registro{points.length !== 1 ? "s" : ""} de pontos
        </p>
        <PointsTimeline points={points} />
      </div>
    </div>
  );
}
