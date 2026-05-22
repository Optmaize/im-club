import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/queries";
import {
  fetchMemberCreditBalance,
  fetchMemberCredits,
  fetchExpiringCredits,
} from "@/app/actions/admin-queries";
import { SaldoCard } from "@/components/cliente/SaldoCard";
import { CreditHistory } from "@/components/cliente/CreditHistory";
import { DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function CreditoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const member = await getMemberForUser(admin, user.id, user.email);
  if (!member) return null;

  const [saldo, credits, expiring] = await Promise.all([
    fetchMemberCreditBalance(member.cliente_id),
    fetchMemberCredits(member.cliente_id),
    fetchExpiringCredits(member.cliente_id, 30),
  ]);

  const creditoExpirando = expiring.reduce((s, c) => s + c.valor, 0);
  const proximaExpiracao = expiring[0]?.expira_em
    ? format(new Date(expiring[0].expira_em), "dd/MM/yyyy", { locale: ptBR })
    : null;

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="p-5 space-y-5">
      <h1 className="font-playfair text-xl font-bold text-ink">Meu Crédito</h1>

      <SaldoCard
        label="Crédito Disponível"
        value={fmtCurrency(saldo)}
        subtitle="para usar em serviços premium"
        icon={DollarSign}
        variant="gold"
        alert={
          creditoExpirando > 0 && proximaExpiracao
            ? `Você tem ${fmtCurrency(creditoExpirando)} expirando em ${proximaExpiracao}!`
            : undefined
        }
      />

      <div className="bg-beige rounded-xl p-4 border border-beige-dark">
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-gold">Como funciona: </span>
          Seu crédito equivale a{" "}
          <strong>8% do valor de cada atendimento</strong> realizado no Studio Isa
          Martina. Pode ser utilizado em serviços premium e combos.
        </p>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-playfair text-base font-semibold text-ink mb-1">
          Histórico de Créditos
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {credits.length} registro{credits.length !== 1 ? "s" : ""} de crédito
        </p>
        <CreditHistory credits={credits} />
      </div>
    </div>
  );
}
