"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { updateMemberStatus, addMemberPoints, addMemberCredit, registerCreditUsage } from "@/lib/queries";
import { Member, MemberWithBalance, MemberStatus, PointRecord, CreditRecord, CreditUsageRecord, Attendance } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, Phone, Calendar, Star, DollarSign, Mail, MinusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberAccessPanel } from "./MemberAccessPanel";

interface MemberDrawerProps {
  member: MemberWithBalance | null;
  points: PointRecord[];
  credits: CreditRecord[];
  creditUsages: CreditUsageRecord[];
  attendances: Attendance[];
  referrals: Member[];
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: string) {
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}

function fmtDateLong(d: string) {
  return format(new Date(d), "dd 'de' MMM yyyy", { locale: ptBR });
}

function isExpired(expira_em: string | null) {
  return expira_em ? new Date(expira_em) < new Date() : false;
}

function recordStatus(r: { utilizado: boolean | null; expira_em: string | null }) {
  if (r.utilizado) return { label: "usado", cls: "text-muted-foreground border-muted-foreground/30" };
  if (isExpired(r.expira_em)) return { label: "expirado", cls: "text-red-500 border-red-200" };
  return { label: "ativo", cls: "text-emerald-600 border-emerald-200" };
}

const typeBadgeConfig: Record<string, { label: string; className: string }> = {
  embaixadora: { label: "Embaixadora", className: "text-amber-700 border-amber-300 bg-amber-50" },
  indicada: { label: "Indicada", className: "text-blue-600 border-blue-200 bg-blue-50" },
  cliente_antiga: { label: "Cliente Antiga", className: "text-gray-500 border-gray-200 bg-gray-50" },
};

function TypeBadge({ tipo }: { tipo: string | null | undefined }) {
  if (!tipo) return <Badge variant="outline" className="text-xs text-muted-foreground">—</Badge>;
  const cfg = typeBadgeConfig[tipo.toLowerCase()] ?? { label: tipo, className: "" };
  return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

export function MemberDrawer({ member, points, credits, creditUsages, attendances, referrals, open, onClose, onUpdated }: MemberDrawerProps) {
  const [statusLoading, setStatusLoading] = useState(false);
  const [addPts, setAddPts] = useState("");
  const [addCreditVal, setAddCreditVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [useVal, setUseVal] = useState("");
  const [useObs, setUseObs] = useState("");
  const [usingCredit, setUsingCredit] = useState(false);

  if (!member) return null;

  async function handleStatusChange(v: string | null) {
    if (!v || !member) return;
    setStatusLoading(true);
    const { error } = await updateMemberStatus(createClient(), member.cliente_id, v);
    setStatusLoading(false);
    if (error) toast.error("Erro ao atualizar status");
    else { toast.success("Status atualizado"); onUpdated(); }
  }

  async function handleAddPoints() {
    if (!member || !addPts) return;
    setSaving(true);
    const { error } = await addMemberPoints(createClient(), {
      cliente_id: member.cliente_id,
      cliente_nome: member.cliente_nome,
      pontos: parseInt(addPts),
      origem: "manual",
    });
    setSaving(false);
    if (error) toast.error("Erro ao adicionar pontos");
    else { toast.success(`${addPts} pontos adicionados`); setAddPts(""); onUpdated(); }
  }

  async function handleAddCredit() {
    if (!member || !addCreditVal) return;
    setSaving(true);
    const { error } = await addMemberCredit(createClient(), {
      cliente_id: member.cliente_id,
      cliente_nome: member.cliente_nome,
      valor: parseFloat(addCreditVal),
      origem: "manual",
    });
    setSaving(false);
    if (error) toast.error("Erro ao adicionar crédito");
    else { toast.success(`${fmt(parseFloat(addCreditVal))} adicionados`); setAddCreditVal(""); onUpdated(); }
  }

  async function handleUseCredit() {
    if (!member || !useVal) return;
    const valor = parseFloat(useVal);
    if (valor > member.credito_disponivel) {
      toast.error("Valor maior que o crédito disponível");
      return;
    }
    setUsingCredit(true);
    const { error } = await registerCreditUsage(createClient(), {
      cliente_id: member.cliente_id,
      cliente_nome: member.cliente_nome,
      valor,
      observacao: useObs || undefined,
    });
    setUsingCredit(false);
    if (error) toast.error("Erro ao registrar uso de crédito");
    else { toast.success(`${fmt(valor)} de crédito registrados como usados`); setUseVal(""); setUseObs(""); onUpdated(); }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        {/* Header fixo */}
        <div className="flex-shrink-0 p-6 border-b border-beige space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-12 h-12 flex-shrink-0">
              <AvatarFallback className="bg-ink text-gold font-playfair font-bold text-base">
                {getInitials(member.cliente_nome)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="font-playfair text-lg text-ink leading-tight truncate">
                {member.cliente_nome}
              </SheetTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <StatusBadge status={(member.status ?? "pendente") as MemberStatus} />
                <TypeBadge tipo={member.tipo} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{member.cliente_id}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              {fmtDate(member.criado_em)}
            </div>
            {member.email && (
              <div className="flex items-center gap-1.5 col-span-2">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate text-xs">{member.email}</span>
              </div>
            )}
          </div>

          {member.indicada_por_nome && (
            <p className="text-xs text-muted-foreground">
              Indicada por <span className="text-ink font-medium">{member.indicada_por_nome}</span>
            </p>
          )}

          {/* Saldos */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-beige rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Pontos</p>
              <p className="text-2xl font-bold text-ink font-playfair leading-none">
                {member.pontos_disponiveis.toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="bg-beige rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Crédito</p>
              <p className="text-xl font-bold text-gold font-playfair leading-none">
                {fmt(member.credito_disponivel)}
              </p>
            </div>
          </div>

          {/* Status + acesso */}
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">Status:</Label>
            <Select value={member.status ?? "pendente"} onValueChange={handleStatusChange} disabled={statusLoading}>
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="recusado">Recusado</SelectItem>
              </SelectContent>
            </Select>
            {statusLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground flex-shrink-0" />}
          </div>

          <MemberAccessPanel
            clienteId={member.cliente_id}
            clienteNome={member.cliente_nome}
            email={member.email ?? null}
            authUserId={member.auth_user_id ?? null}
            onUpdated={onUpdated}
          />
        </div>

        {/* Tabs com scroll */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs defaultValue="pontos" className="flex flex-col h-full">
            <TabsList className="flex-shrink-0 w-full rounded-none border-b border-beige bg-white">
              <TabsTrigger value="pontos" className="flex-1 text-xs">Pontos</TabsTrigger>
              <TabsTrigger value="creditos" className="flex-1 text-xs">Créditos</TabsTrigger>
              <TabsTrigger value="atendimentos" className="flex-1 text-xs">Atend.</TabsTrigger>
              <TabsTrigger value="indicacoes" className="flex-1 text-xs">Indicações</TabsTrigger>
            </TabsList>

            {/* Pontos */}
            <TabsContent value="pontos" className="flex-1 overflow-y-auto m-0 p-4 space-y-3">
              <div className="bg-beige rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Adicionar pontos manualmente</p>
                <div className="flex gap-2">
                  <Input type="number" placeholder="Qtd." value={addPts} onChange={(e) => setAddPts(e.target.value)} className="h-8 text-sm" />
                  <Button size="sm" onClick={handleAddPoints} disabled={saving || !addPts} className="bg-ink text-gold hover:bg-ink-light h-8 px-3 flex-shrink-0">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Star className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              {points.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro</p>
              ) : points.map((p) => {
                const st = recordStatus(p);
                return (
                  <div key={p.id} className="flex justify-between items-start py-2.5 border-b border-beige last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-ink">+{p.pontos} pts</p>
                      <p className="text-xs text-muted-foreground">{p.origem}</p>
                      <p className="text-xs text-muted-foreground">{fmtDateLong(p.criado_em)}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ${st.cls}`}>{st.label}</Badge>
                  </div>
                );
              })}
            </TabsContent>

            {/* Créditos */}
            <TabsContent value="creditos" className="flex-1 overflow-y-auto m-0 p-4 space-y-4">
              <div className="bg-beige rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Adicionar crédito manualmente</p>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="R$ 0,00" value={addCreditVal} onChange={(e) => setAddCreditVal(e.target.value)} className="h-8 text-sm" />
                  <Button size="sm" onClick={handleAddCredit} disabled={saving || !addCreditVal} className="bg-ink text-gold hover:bg-ink-light h-8 px-3 flex-shrink-0">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>

              <div className="bg-beige rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Registrar uso de crédito <span className="text-muted-foreground/70">· disponível: {fmt(member.credito_disponivel)}</span>
                </p>
                <div className="flex gap-2">
                  <Input type="number" step="0.01" placeholder="R$ 0,00" value={useVal} onChange={(e) => setUseVal(e.target.value)} className="h-8 text-sm" />
                  <Button size="sm" onClick={handleUseCredit} disabled={usingCredit || !useVal} className="bg-ink text-gold hover:bg-ink-light h-8 px-3 flex-shrink-0">
                    {usingCredit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MinusCircle className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <Input placeholder="Observação (opcional)" value={useObs} onChange={(e) => setUseObs(e.target.value)} className="h-8 text-sm" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Concedidos</p>
                {credits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro</p>
                ) : credits.map((c) => {
                  const st = recordStatus(c);
                  return (
                    <div key={c.id} className="flex justify-between items-start py-2.5 border-b border-beige last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-ink">{fmt(c.valor)}</p>
                        <p className="text-xs text-muted-foreground">{c.origem ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">{fmtDateLong(c.criado_em)}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${st.cls}`}>{st.label}</Badge>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Histórico de uso</p>
                {creditUsages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum resgate registrado ainda</p>
                ) : creditUsages.map((u) => (
                  <div key={u.id} className="flex justify-between items-start py-2.5 border-b border-beige last:border-0">
                    <div>
                      <p className="text-sm font-semibold text-ink">- {fmt(u.valor)}</p>
                      <p className="text-xs text-muted-foreground">{u.observacao ?? "Resgatado por " + u.criado_por}</p>
                      <p className="text-xs text-muted-foreground">{fmtDateLong(u.criado_em)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Atendimentos */}
            <TabsContent value="atendimentos" className="flex-1 overflow-y-auto m-0 p-4">
              {attendances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum atendimento</p>
              ) : attendances.map((a, i) => (
                <div key={a.id} className={`flex justify-between py-2.5 ${i < attendances.length - 1 ? "border-b border-beige" : ""}`}>
                  <div>
                    <p className="text-sm font-semibold text-ink">{a.valor != null ? fmt(a.valor) : "—"}</p>
                    <p className="text-xs text-muted-foreground">{a.processado_em ? fmtDateLong(a.processado_em) : "—"}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            {/* Indicações */}
            <TabsContent value="indicacoes" className="flex-1 overflow-y-auto m-0 p-4">
              {referrals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma indicação</p>
              ) : referrals.map((r, i) => (
                <div key={r.cliente_id} className={`flex justify-between items-center py-2.5 ${i < referrals.length - 1 ? "border-b border-beige" : ""}`}>
                  <div>
                    <p className="text-sm font-medium text-ink">{r.cliente_nome}</p>
                    <p className="text-xs text-muted-foreground">{r.cliente_id}</p>
                  </div>
                  <StatusBadge status={(r.status ?? "pendente") as MemberStatus} />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
