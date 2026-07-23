"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./StatusBadge";
import {
  Loader2,
  Phone,
  Mail,
  Cake,
  Star,
  DollarSign,
  MinusCircle,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  enrollAvecClienteInClub,
  fetchMemberWithBalance,
  fetchMemberCreditUsages,
  adminUpdateMemberStatus,
  adminUpdateMemberTipo,
} from "@/app/actions/admin-queries";
import { registerCreditUsage } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import { IndicadoraSelect } from "@/components/admin/IndicadoraSelect";
import { MemberAccessPanel } from "@/components/admin/MemberAccessPanel";
import {
  AvecClienteWithStatus,
  CreditUsageRecord,
  Member,
  MemberStatus,
  MemberType,
  MemberWithBalance,
} from "@/lib/types";

interface Props {
  avec: AvecClienteWithStatus | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
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

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function AvecClienteDrawer({ avec, open, onClose, onUpdated }: Props) {
  const [memberProfile, setMemberProfile] = useState<MemberWithBalance | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [creditUsages, setCreditUsages] = useState<CreditUsageRecord[]>([]);
  const [useVal, setUseVal] = useState("");
  const [useObs, setUseObs] = useState("");
  const [usingCredit, setUsingCredit] = useState(false);

  // Status / tipo inline editing
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<MemberStatus>("ativo");
  const [editingTipo, setEditingTipo] = useState(false);
  const [newTipo, setNewTipo] = useState<MemberType>("indicada");
  const [updating, setUpdating] = useState(false);

  // Enrollment form
  const [tipo, setTipo] = useState<MemberType>("indicada");
  const [status, setStatus] = useState<MemberStatus>("pendente");
  const [indicadora, setIndicadora] = useState<Member | null>(null);
  const [pontosBoasVindas, setPontosBoasVindas] = useState(0);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    if (!avec || !open) return;
    if (avec.im_status && avec.celular) {
      setProfileLoading(true);
      Promise.all([
        fetchMemberWithBalance(avec.celular),
        fetchMemberCreditUsages(avec.celular),
      ]).then(([m, usages]) => {
        setMemberProfile(m);
        setCreditUsages(usages);
        if (m) {
          setNewStatus(m.status ?? "ativo");
          setNewTipo(m.tipo ?? "indicada");
        }
        setProfileLoading(false);
      });
    } else {
      setMemberProfile(null);
      setCreditUsages([]);
    }
    // Reset form
    setTipo("indicada");
    setStatus("pendente");
    setIndicadora(null);
    setPontosBoasVindas(0);
    setEditingStatus(false);
    setEditingTipo(false);
  }, [avec?.cliente_id, open]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleEnroll() {
    if (!avec?.celular) { toast.error("Celular não disponível"); return; }
    setEnrolling(true);
    const result = await enrollAvecClienteInClub(
      { celular: avec.celular, nome: avec.nome ?? "", email: avec.email },
      {
        tipo,
        status,
        indicadaPorId: indicadora?.cliente_id ?? null,
        indicadaPorNome: indicadora?.cliente_nome ?? null,
        pontosBoasVindas,
      }
    );
    setEnrolling(false);
    if (result.success) {
      toast.success(`${avec.nome ?? "Cliente"} adicionada ao IM Club!`);
      onUpdated();
      onClose();
    } else {
      toast.error(result.error ?? "Erro ao cadastrar");
    }
  }

  async function handleStatusUpdate() {
    if (!avec?.celular) return;
    setUpdating(true);
    const result = await adminUpdateMemberStatus(avec.celular, newStatus);
    setUpdating(false);
    if (result.success) {
      setMemberProfile((p) => p ? { ...p, status: newStatus } : p);
      setEditingStatus(false);
      toast.success("Status atualizado!");
      onUpdated();
    } else {
      toast.error("Erro ao atualizar status");
    }
  }

  async function handleTipoUpdate() {
    if (!avec?.celular) return;
    setUpdating(true);
    const result = await adminUpdateMemberTipo(avec.celular, newTipo);
    setUpdating(false);
    if (result.success) {
      setMemberProfile((p) => p ? { ...p, tipo: newTipo } : p);
      setEditingTipo(false);
      toast.success("Tipo atualizado!");
      onUpdated();
    } else {
      toast.error("Erro ao atualizar tipo");
    }
  }

  async function handleUseCredit() {
    if (!memberProfile || !useVal) return;
    const valor = parseFloat(useVal);
    if (valor > memberProfile.credito_disponivel) {
      toast.error("Valor maior que o crédito disponível");
      return;
    }
    setUsingCredit(true);
    const { error } = await registerCreditUsage(createClient(), {
      cliente_id: memberProfile.cliente_id,
      cliente_nome: memberProfile.cliente_nome,
      valor,
      observacao: useObs || undefined,
    });
    setUsingCredit(false);
    if (error) {
      toast.error("Erro ao registrar uso de crédito");
      return;
    }
    toast.success(`${fmt(valor)} de crédito registrados como usados`);
    setUseVal("");
    setUseObs("");
    setMemberProfile((p) => (p ? { ...p, credito_disponivel: p.credito_disponivel - valor } : p));
    fetchMemberCreditUsages(memberProfile.cliente_id).then(setCreditUsages);
    onUpdated();
  }

  if (!avec) return null;

  const isEnrolled = !!avec.im_status;
  const initials = getInitials(avec.nome ?? "?");

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0">
        <SheetTitle className="sr-only">{avec.nome ?? "Cliente"}</SheetTitle>

        {/* ── Header ── */}
        <div className="bg-ink p-6 pb-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
              <span className="font-playfair text-lg font-bold text-gold">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-playfair text-lg font-bold text-white truncate">
                {avec.nome ?? "—"}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isEnrolled ? (
                  <>
                    <StatusBadge status={memberProfile?.status ?? avec.im_status!} />
                    <TypeBadge tipo={memberProfile?.tipo ?? avec.im_tipo} />
                  </>
                ) : (
                  <Badge variant="outline" className="text-xs text-white/50 border-white/20">
                    Fora do clube
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {avec.celular && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{avec.celular}</span>
              </div>
            )}
            {avec.email && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{avec.email}</span>
              </div>
            )}
            {avec.aniversario && (
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <Cake className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{avec.aniversario}</span>
              </div>
            )}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4">
          {isEnrolled ? (
            profileLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : memberProfile ? (
              <>
                {/* Saldo */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-beige rounded-xl p-4 text-center">
                    <Star className="w-4 h-4 text-gold mx-auto mb-1" />
                    <p className="font-playfair text-2xl font-bold text-ink">
                      {memberProfile.pontos_disponiveis.toLocaleString("pt-BR")}
                    </p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                  <div className="bg-beige rounded-xl p-4 text-center">
                    <DollarSign className="w-4 h-4 text-gold mx-auto mb-1" />
                    <p className="font-playfair text-2xl font-bold text-ink">
                      {fmt(memberProfile.credito_disponivel)}
                    </p>
                    <p className="text-xs text-muted-foreground">crédito</p>
                  </div>
                </div>

                {/* Registrar uso de crédito */}
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                  <p className="text-sm font-medium text-ink">Registrar uso de crédito</p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="R$ 0,00"
                      value={useVal}
                      onChange={(e) => setUseVal(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={handleUseCredit}
                      disabled={usingCredit || !useVal}
                      className="bg-ink text-gold hover:bg-ink-light h-9 px-3 flex-shrink-0"
                    >
                      {usingCredit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MinusCircle className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                  <Input
                    placeholder="Observação (opcional)"
                    value={useObs}
                    onChange={(e) => setUseObs(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                {/* Histórico de uso */}
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-1">
                  <p className="text-sm font-medium text-ink mb-1">Histórico de uso</p>
                  {creditUsages.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">Nenhum resgate registrado ainda</p>
                  ) : (
                    creditUsages.map((u) => (
                      <div key={u.id} className="flex justify-between items-start py-2 border-b border-beige last:border-0">
                        <div>
                          <p className="text-sm font-semibold text-ink">- {fmt(u.valor)}</p>
                          <p className="text-xs text-muted-foreground">{u.observacao ?? `Resgatado por ${u.criado_por}`}</p>
                        </div>
                        <p className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(u.criado_em).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Status */}
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">Status no clube</span>
                    <button
                      className="text-xs text-gold underline"
                      onClick={() => { setEditingStatus(!editingStatus); setEditingTipo(false); }}
                    >
                      {editingStatus ? "Cancelar" : "Alterar"}
                    </button>
                  </div>
                  {editingStatus ? (
                    <div className="flex gap-2">
                      <Select value={newStatus} onValueChange={(v) => setNewStatus(v as MemberStatus)}>
                        <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="recusado">Recusado</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleStatusUpdate}
                        disabled={updating}
                        className="bg-ink text-gold hover:bg-ink-light h-8 px-3"
                      >
                        {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                      </Button>
                    </div>
                  ) : (
                    <StatusBadge status={memberProfile.status ?? "pendente"} />
                  )}
                </div>

                {/* Tipo */}
                <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">Tipo de membro</span>
                    <button
                      className="text-xs text-gold underline"
                      onClick={() => { setEditingTipo(!editingTipo); setEditingStatus(false); }}
                    >
                      {editingTipo ? "Cancelar" : "Alterar"}
                    </button>
                  </div>
                  {editingTipo ? (
                    <div className="flex gap-2">
                      <Select value={newTipo} onValueChange={(v) => setNewTipo(v as MemberType)}>
                        <SelectTrigger className="flex-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="embaixadora">Embaixadora</SelectItem>
                          <SelectItem value="indicada">Indicada</SelectItem>
                          <SelectItem value="cliente_antiga">Cliente Antiga</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={handleTipoUpdate}
                        disabled={updating}
                        className="bg-ink text-gold hover:bg-ink-light h-8 px-3"
                      >
                        {updating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                      </Button>
                    </div>
                  ) : (
                    <TypeBadge tipo={memberProfile.tipo} />
                  )}
                </div>

                {memberProfile.indicada_por_nome && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-xs text-muted-foreground">Indicada por</p>
                    <p className="text-sm font-medium text-ink mt-0.5">
                      {memberProfile.indicada_por_nome}
                    </p>
                  </div>
                )}

                <MemberAccessPanel
                  clienteId={memberProfile.cliente_id}
                  clienteNome={memberProfile.cliente_nome}
                  email={memberProfile.email ?? null}
                  authUserId={memberProfile.auth_user_id ?? null}
                  onUpdated={onUpdated}
                />
              </>
            ) : null
          ) : (
            /* ── Enrollment form ── */
            <>
              {!avec.celular ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">
                    Esta cliente não tem celular cadastrado no AVEC. Não é possível
                    adicioná-la ao IM Club sem um número de celular.
                  </p>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <UserPlus className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-800">
                        Adicionar ao IM Club
                      </span>
                    </div>
                    <p className="text-xs text-amber-700">
                      Celular: <strong>{avec.celular}</strong>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tipo</Label>
                        <Select value={tipo} onValueChange={(v) => setTipo(v as MemberType)}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="indicada">Indicada</SelectItem>
                            <SelectItem value="embaixadora">Embaixadora</SelectItem>
                            <SelectItem value="cliente_antiga">Cliente Antiga</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Status inicial</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as MemberStatus)}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ativo">Ativo</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Indicada por */}
                    <IndicadoraSelect value={indicadora} onChange={setIndicadora} />

                    {/* Pontos boas-vindas */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">Pontos de boas-vindas</Label>
                      <Input
                        type="number"
                        min={0}
                        value={pontosBoasVindas}
                        onChange={(e) => setPontosBoasVindas(parseInt(e.target.value) || 0)}
                        className="h-9 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        0 = sem pontos iniciais. Quando informados, expiram em 1 ano.
                      </p>
                    </div>

                    {status === "ativo" && indicadora && (
                      <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        ✓ <strong>{indicadora.cliente_nome}</strong> receberá <strong>300 pontos</strong> de indicação automaticamente.
                      </p>
                    )}

                    <Button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full bg-ink text-gold hover:bg-ink-light h-10"
                    >
                      {enrolling ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <UserPlus className="w-4 h-4 mr-2" />
                      )}
                      Adicionar ao IM Club
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
