import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/queries";
import { fetchMemberAttendances, fetchMemberPoints } from "@/app/actions/admin-queries";
import { Scissors } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function sameDay(a: string, b: string) {
  return a.slice(0, 10) === b.slice(0, 10);
}

export default async function AtendimentosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createAdminClient();
  const member = await getMemberForUser(admin, user.id, user.email);
  if (!member) return null;

  const [attendances, allPoints] = await Promise.all([
    fetchMemberAttendances(member.cliente_id),
    fetchMemberPoints(member.cliente_id),
  ]);

  const atendimentoPoints = allPoints.filter((p) => p.origem === "atendimento");
  const totalGasto = attendances.reduce((s, a) => s + (a.valor ?? 0), 0);
  const totalPontos = atendimentoPoints.reduce((s, p) => s + p.pontos, 0);

  // Mapear pontos gerados por data de atendimento
  function pontosNaData(dataAtend: string | null) {
    if (!dataAtend) return 0;
    return atendimentoPoints
      .filter((p) => sameDay(p.criado_em, dataAtend))
      .reduce((s, p) => s + p.pontos, 0);
  }

  return (
    <div className="p-5 space-y-5">
      <h1 className="font-playfair text-xl font-bold text-ink">
        Meus Atendimentos
      </h1>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-ink rounded-2xl p-4">
          <p className="text-xs text-white/50">Total investido</p>
          <p className="font-playfair text-xl font-bold text-gold">
            {formatCurrency(totalGasto)}
          </p>
        </div>
        <div className="bg-beige rounded-2xl p-4 border border-beige-dark">
          <p className="text-xs text-muted-foreground">Pontos gerados</p>
          <p className="font-playfair text-xl font-bold text-ink">
            {totalPontos.toLocaleString("pt-BR")}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h2 className="font-playfair text-base font-semibold text-ink mb-1">
          Histórico
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          {attendances.length} atendimento{attendances.length !== 1 ? "s" : ""}{" "}
          registrado{attendances.length !== 1 ? "s" : ""}
        </p>

        {attendances.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center mx-auto mb-3">
              <Scissors className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento registrado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-0">
            {attendances.map((a, i) => {
              const pts = pontosNaData(a.processado_em);
              return (
                <div
                  key={a.id}
                  className={`flex justify-between items-center py-4 ${
                    i < attendances.length - 1 ? "border-b border-beige" : ""
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {a.valor != null ? formatCurrency(a.valor) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.processado_em
                        ? format(new Date(a.processado_em), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })
                        : "—"}
                    </p>
                  </div>
                  {pts > 0 && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5">
                      +{pts} pts
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
