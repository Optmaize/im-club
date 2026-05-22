import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/queries";
import {
  fetchMemberPointsBalance,
  fetchMemberCreditBalance,
  fetchExpiringPoints,
} from "@/app/actions/admin-queries";
import { SaldoCard } from "@/components/cliente/SaldoCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Star, DollarSign, UserCheck } from "lucide-react";
import { MemberStatus } from "@/lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function MinhaContaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const member = await getMemberForUser(admin, user.id, user.email);
  if (!member) return null;

  const [pontos, credito, expiring] = await Promise.all([
    fetchMemberPointsBalance(member.cliente_id),
    fetchMemberCreditBalance(member.cliente_id),
    fetchExpiringPoints(member.cliente_id, 30),
  ]);

  const pontosExpirando = expiring.reduce((s, p) => s + p.pontos, 0);
  const proximaExpiracao = expiring[0]?.expira_em
    ? format(new Date(expiring[0].expira_em), "dd/MM/yyyy", { locale: ptBR })
    : null;

  return (
    <div className="p-5 space-y-5">
      <div>
        <p className="text-muted-foreground text-sm">Bem-vinda ao clube ✨</p>
        <h1 className="font-playfair text-2xl font-bold text-ink leading-tight">
          {member.cliente_nome.split(" ")[0]}
        </h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={(member.status ?? "pendente") as MemberStatus} />
        {member.indicada_por_nome && (
          <p className="text-xs text-muted-foreground">
            Convidada por{" "}
            <span className="text-ink font-medium">{member.indicada_por_nome}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <SaldoCard
          label="Seus Pontos"
          value={pontos.toLocaleString("pt-BR")}
          subtitle="pontos disponíveis"
          icon={Star}
          variant="gold"
          alert={
            pontosExpirando > 0 && proximaExpiracao
              ? `Você tem ${pontosExpirando} pontos expirando em ${proximaExpiracao} — use antes que expirem!`
              : undefined
          }
        />
        <SaldoCard
          label="Seu Crédito"
          value={new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(credito)}
          subtitle="crédito disponível para usar"
          icon={DollarSign}
          variant="ink"
        />
      </div>

      <div className="bg-white rounded-xl p-4 space-y-2 shadow-sm">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-gold" />
          <p className="text-sm font-semibold text-ink">Meu Perfil</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Celular</p>
            <p className="text-ink font-medium">{member.cliente_id}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tipo</p>
            <p className="text-ink font-medium capitalize">
              {member.tipo === "cliente_antiga"
                ? "Cliente Antiga"
                : member.tipo === "embaixadora"
                ? "Embaixadora"
                : "Indicada"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
