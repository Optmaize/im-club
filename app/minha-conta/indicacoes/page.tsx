import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/queries";
import { fetchMemberReferrals } from "@/app/actions/admin-queries";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { IndicaModal } from "@/components/cliente/IndicaModal";
import { MemberStatus } from "@/lib/types";
import { Users, UserPlus, Star, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function IndicacoesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const member = await getMemberForUser(admin, user.id, user.email);
  if (!member) return null;

  const referrals = await fetchMemberReferrals(member.cliente_id);
  const ativas = referrals.filter((r) => r.status === "ativo").length;

  return (
    <div className="p-5 space-y-5">
      <h1 className="font-playfair text-xl font-bold text-ink">
        Minhas Indicações
      </h1>

      <div className="bg-ink rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50">Total indicado</p>
          <p className="font-playfair text-3xl font-bold text-gold">
            {referrals.length}
          </p>
          <p className="text-xs text-white/50 mt-1">
            {ativas} ativa{ativas !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center">
          <Users className="w-6 h-6 text-gold" />
        </div>
      </div>

      {/* Benefício por indicação */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <p className="text-xs text-muted-foreground mb-3 font-medium">Ao indicar uma nova cliente ativa, você ganha:</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-beige rounded-lg p-3 text-center">
            <Star className="w-4 h-4 text-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-ink font-playfair">300</p>
            <p className="text-xs text-muted-foreground">pontos</p>
          </div>
          <div className="bg-beige rounded-lg p-3 text-center">
            <DollarSign className="w-4 h-4 text-gold mx-auto mb-1" />
            <p className="text-lg font-bold text-ink font-playfair">R$ 30</p>
            <p className="text-xs text-muted-foreground">em crédito</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-playfair text-base font-semibold text-ink mb-4">
          Minhas Indicadas
        </h2>

        {referrals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Você ainda não indicou ninguém.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {referrals.map((r, i) => (
              <div
                key={r.cliente_id}
                className={`flex items-center justify-between py-3 ${
                  i < referrals.length - 1 ? "border-b border-beige" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-ink">{r.cliente_nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.criado_em
                      ? format(new Date(r.criado_em), "dd/MM/yyyy", { locale: ptBR })
                      : r.cliente_id}
                  </p>
                </div>
                <StatusBadge status={(r.status ?? "pendente") as MemberStatus} />
              </div>
            ))}
          </div>
        )}
      </div>

      <IndicaModal />
    </div>
  );
}
