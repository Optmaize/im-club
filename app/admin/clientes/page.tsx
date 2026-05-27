"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { createClient } from "@/lib/supabase/client";
import { listMembers } from "@/lib/queries";
import {
  fetchMemberWithBalance,
  fetchMemberPoints,
  fetchMemberCredits,
  fetchMemberAttendances,
  fetchMemberReferrals,
  fetchMemberBalancesBatch,
  fetchAvecClientes,
  fetchAvecStats,
} from "@/app/actions/admin-queries";
import {
  Member,
  MemberWithBalance,
  PointRecord,
  CreditRecord,
  Attendance,
  MemberStatus,
  AvecClienteWithStatus,
  AvecFilter,
} from "@/lib/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import dynamic from "next/dynamic";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Cake,
  Users,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/lib/hooks";

const MemberDrawer = dynamic(
  () => import("@/components/admin/MemberDrawer").then((m) => m.MemberDrawer),
  { ssr: false }
);
const NewMemberModal = dynamic(
  () => import("@/components/admin/NewMemberModal").then((m) => m.NewMemberModal),
  { ssr: false }
);
const AvecClienteDrawer = dynamic(
  () => import("@/components/admin/AvecClienteDrawer").then((m) => m.AvecClienteDrawer),
  { ssr: false }
);

const IM_PAGE_SIZE = 20;
const AVEC_PAGE_SIZE = 30;

const typeBadgeConfig: Record<string, { label: string; className: string }> = {
  embaixadora: { label: "Embaixadora", className: "text-amber-700 border-amber-300 bg-amber-50" },
  indicada: { label: "Indicada", className: "text-blue-600 border-blue-200 bg-blue-50" },
  cliente_antiga: { label: "Cliente Antiga", className: "text-gray-500 border-gray-200 bg-gray-50" },
};

function TypeBadge({ tipo }: { tipo: string | null | undefined }) {
  if (!tipo)
    return <Badge variant="outline" className="text-xs text-muted-foreground">—</Badge>;
  const cfg = typeBadgeConfig[tipo.toLowerCase()] ?? { label: tipo, className: "" };
  return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

function ImClubBadge({ status }: { status: MemberStatus | null }) {
  if (!status)
    return <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">Fora do clube</Badge>;
  return <StatusBadge status={status} />;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function getBirthdayMonth(aniversario: string | null | undefined): number | null {
  if (!aniversario?.trim()) return null;
  const parts = aniversario.trim().split("/");
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10);
    if (!isNaN(m) && m >= 1 && m <= 12) return m;
  }
  return null;
}

const filterLabels: Record<AvecFilter, string> = {
  todos: "Todas",
  no_clube: "No Clube",
  fora_clube: "Fora do Clube",
  aniversariantes: "Aniversariantes",
};

// ─── Memoized IM Club row ────────────────────────────────────────────────────

const MemberRow = memo(function MemberRow({
  m,
  bal,
  onClick,
}: {
  m: Member;
  bal: { pontos: number; credito: number } | undefined;
  onClick: () => void;
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-beige/50 border-beige transition-colors"
      onClick={onClick}
    >
      <TableCell className="font-medium text-ink text-sm">{m.cliente_nome}</TableCell>
      <TableCell className="text-sm text-muted-foreground">{m.cliente_id}</TableCell>
      <TableCell><TypeBadge tipo={m.tipo} /></TableCell>
      <TableCell><StatusBadge status={(m.status ?? "pendente") as MemberStatus} /></TableCell>
      <TableCell className="text-sm text-right font-medium text-ink">
        {bal != null ? bal.pontos.toLocaleString("pt-BR") : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-sm text-right font-medium text-gold">
        {bal != null ? formatCurrency(bal.credito) : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{m.indicada_por_nome ?? "—"}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(m.criado_em), "dd/MM/yyyy", { locale: ptBR })}
      </TableCell>
    </TableRow>
  );
});

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  const currentMonth = new Date().getMonth() + 1;

  // ── Tab ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("avec");
  const [newModalOpen, setNewModalOpen] = useState(false);

  // ── AVEC state ───────────────────────────────────────────────────────────
  const [avecData, setAvecData] = useState<AvecClienteWithStatus[]>([]);
  const [avecBalances, setAvecBalances] = useState<Record<string, { pontos: number; credito: number }>>({});
  const [avecTotal, setAvecTotal] = useState(0);
  const [avecPage, setAvecPage] = useState(1);
  const [avecSearch, setAvecSearch] = useState("");
  const [avecFilter, setAvecFilter] = useState<AvecFilter>("todos");
  const [avecLoading, setAvecLoading] = useState(true);
  const [avecStats, setAvecStats] = useState<{
    total: number;
    noClube: number;
    aniversariantesMes: number;
  } | null>(null);
  const [selectedAvec, setSelectedAvec] = useState<AvecClienteWithStatus | null>(null);
  const [avecDrawerOpen, setAvecDrawerOpen] = useState(false);

  const debouncedAvecSearch = useDebounce(avecSearch, 350);

  // ── IM Club state ────────────────────────────────────────────────────────
  const [members, setMembers] = useState<Member[]>([]);
  const [balances, setBalances] = useState<Record<string, { pontos: number; credito: number }>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [selectedMember, setSelectedMember] = useState<MemberWithBalance | null>(null);
  const [drawerPoints, setDrawerPoints] = useState<PointRecord[]>([]);
  const [drawerCredits, setDrawerCredits] = useState<CreditRecord[]>([]);
  const [drawerAttendances, setDrawerAttendances] = useState<Attendance[]>([]);
  const [drawerReferrals, setDrawerReferrals] = useState<Member[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  // ── Data loaders ─────────────────────────────────────────────────────────

  const loadAvecStats = useCallback(() => {
    fetchAvecStats().then(setAvecStats);
  }, []);

  const loadAvec = useCallback(async () => {
    setAvecLoading(true);
    const { data, count } = await fetchAvecClientes(avecPage, debouncedAvecSearch, avecFilter);
    setAvecData(data);
    setAvecTotal(count);

    const enrolledIds = data.filter((a) => a.im_status && a.celular).map((a) => a.celular!);
    if (enrolledIds.length > 0) {
      fetchMemberBalancesBatch(enrolledIds).then(setAvecBalances);
    } else {
      setAvecBalances({});
    }
    setAvecLoading(false);
  }, [avecPage, debouncedAvecSearch, avecFilter]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, count } = await listMembers(supabase, {
      page,
      pageSize: IM_PAGE_SIZE,
      search: debouncedSearch,
    });
    setMembers(data);
    setTotal(count);
    setLoading(false);
    if (data.length > 0) {
      const ids = data.map((m) => m.cliente_id);
      fetchMemberBalancesBatch(ids).then(setBalances);
    } else {
      setBalances({});
    }
  }, [page, debouncedSearch]);

  // Initial loads
  useEffect(() => { loadAvecStats(); }, [loadAvecStats]);
  useEffect(() => { loadAvec(); }, [loadAvec]);
  useEffect(() => { if (activeTab === "imclub") loadMembers(); }, [loadMembers, activeTab]);

  // Reset pages on search/filter change
  useEffect(() => { setAvecPage(1); }, [debouncedAvecSearch, avecFilter]);
  useEffect(() => { setPage(1); }, [debouncedSearch]);

  async function openMemberDrawer(member: Member) {
    setDrawerOpen(true);
    setDrawerLoading(true);
    const [profile, points, credits, attendances, referrals] = await Promise.all([
      fetchMemberWithBalance(member.cliente_id),
      fetchMemberPoints(member.cliente_id),
      fetchMemberCredits(member.cliente_id),
      fetchMemberAttendances(member.cliente_id),
      fetchMemberReferrals(member.cliente_id),
    ]);
    setSelectedMember(profile);
    setDrawerPoints(points);
    setDrawerCredits(credits);
    setDrawerAttendances(attendances);
    setDrawerReferrals(referrals);
    setDrawerLoading(false);
  }

  const avecTotalPages = Math.ceil(avecTotal / AVEC_PAGE_SIZE);
  const totalPages = Math.ceil(total / IM_PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Base AVEC e membros do IM Club
          </p>
        </div>
        <Button
          onClick={() => setNewModalOpen(true)}
          className="bg-ink text-gold hover:bg-ink-light gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo membro
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-beige">
          <TabsTrigger value="avec" className="gap-1.5">
            <Users className="w-3.5 h-3.5" />
            Base AVEC
            {avecStats && (
              <span className="ml-1 text-muted-foreground">({avecStats.total})</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="imclub" className="gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            IM Club
            {total > 0 && (
              <span className="ml-1 text-muted-foreground">({total})</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── AVEC Tab ── */}
        <TabsContent value="avec" className="space-y-4 mt-4">
          {/* Stats */}
          {avecStats && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border-0">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Base AVEC</p>
                </div>
                <p className="font-playfair text-2xl font-bold text-ink">{avecStats.total}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-0">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="w-4 h-4 text-gold" />
                  <p className="text-xs text-muted-foreground">No IM Club</p>
                </div>
                <p className="font-playfair text-2xl font-bold text-gold">{avecStats.noClube}</p>
                <p className="text-[10px] text-muted-foreground">
                  {avecStats.total > 0
                    ? `${Math.round((avecStats.noClube / avecStats.total) * 100)}% da base`
                    : ""}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-0">
                <div className="flex items-center gap-2 mb-1">
                  <Cake className="w-4 h-4 text-pink-400" />
                  <p className="text-xs text-muted-foreground">Aniversariantes</p>
                </div>
                <p className="font-playfair text-2xl font-bold text-ink">
                  {avecStats.aniversariantesMes}
                </p>
                <p className="text-[10px] text-muted-foreground">este mês</p>
              </div>
            </div>
          )}

          {/* Search + filter chips */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                value={avecSearch}
                onChange={(e) => setAvecSearch(e.target.value)}
                placeholder="Buscar por nome ou celular..."
                className="pl-10 bg-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(filterLabels) as AvecFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setAvecFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    avecFilter === f
                      ? "bg-ink text-gold"
                      : "bg-white text-muted-foreground hover:bg-beige border border-beige"
                  }`}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-beige">
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Celular</TableHead>
                      <TableHead className="text-xs">Aniversário</TableHead>
                      <TableHead className="text-xs">IM Club</TableHead>
                      <TableHead className="text-xs text-right">Pontos</TableHead>
                      <TableHead className="text-xs text-right">Crédito</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {avecLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : avecData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                          Nenhuma cliente encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      avecData.map((a) => {
                        const isBirthdayMonth = getBirthdayMonth(a.aniversario) === currentMonth;
                        const bal = a.celular ? avecBalances[a.celular] : undefined;
                        return (
                          <TableRow
                            key={a.id}
                            className="cursor-pointer hover:bg-beige/50 border-beige transition-colors"
                            onClick={() => {
                              setSelectedAvec(a);
                              setAvecDrawerOpen(true);
                            }}
                          >
                            <TableCell className="font-medium text-ink text-sm">
                              <div className="flex items-center gap-1.5">
                                {a.nome ?? "—"}
                                {isBirthdayMonth && (
                                  <Cake className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.celular ?? <span className="text-xs text-red-400">sem celular</span>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {a.aniversario || "—"}
                            </TableCell>
                            <TableCell>
                              <ImClubBadge status={a.im_status} />
                            </TableCell>
                            <TableCell className="text-sm text-right font-medium text-ink">
                              {bal != null
                                ? bal.pontos.toLocaleString("pt-BR")
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-sm text-right font-medium text-gold">
                              {bal != null
                                ? formatCurrency(bal.credito)
                                : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {avecTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página {avecPage} de {avecTotalPages} · {avecTotal} clientes
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAvecPage((p) => Math.max(1, p - 1))}
                  disabled={avecPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAvecPage((p) => Math.min(avecTotalPages, p + 1))}
                  disabled={avecPage === avecTotalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── IM Club Tab ── */}
        <TabsContent value="imclub" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou celular..."
              className="pl-10 bg-white"
            />
          </div>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-beige">
                      <TableHead className="text-xs">Nome</TableHead>
                      <TableHead className="text-xs">Celular</TableHead>
                      <TableHead className="text-xs">Tipo</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Pontos</TableHead>
                      <TableHead className="text-xs text-right">Crédito (R$)</TableHead>
                      <TableHead className="text-xs">Indicada por</TableHead>
                      <TableHead className="text-xs">Cadastro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12">
                          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mx-auto" />
                        </TableCell>
                      </TableRow>
                    ) : members.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                          {activeTab === "imclub" && total === 0
                            ? "Nenhum membro cadastrado"
                            : "Nenhum membro encontrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      members.map((m) => (
                        <MemberRow
                          key={m.cliente_id}
                          m={m}
                          bal={balances[m.cliente_id]}
                          onClick={() => openMemberDrawer(m)}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Prompt to add first member */}
          {!loading && members.length === 0 && total === 0 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-beige flex items-center justify-center mx-auto mb-3">
                <UserPlus className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Nenhum membro no IM Club ainda. Adicione pela base AVEC ou manualmente.
              </p>
              <Button
                size="sm"
                onClick={() => setNewModalOpen(true)}
                className="bg-ink text-gold hover:bg-ink-light"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Novo membro
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Drawers & Modals ── */}
      {avecDrawerOpen && (
        <AvecClienteDrawer
          avec={selectedAvec}
          open={avecDrawerOpen}
          onClose={() => { setAvecDrawerOpen(false); setSelectedAvec(null); }}
          onUpdated={() => {
            loadAvec();
            loadAvecStats();
          }}
        />
      )}

      {drawerOpen && (
        <MemberDrawer
          member={selectedMember}
          points={drawerPoints}
          credits={drawerCredits}
          attendances={drawerAttendances}
          referrals={drawerReferrals}
          open={drawerOpen && !drawerLoading}
          onClose={() => { setDrawerOpen(false); setSelectedMember(null); }}
          onUpdated={() => {
            loadMembers();
            if (selectedMember) openMemberDrawer(selectedMember);
          }}
        />
      )}

      <NewMemberModal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onCreated={() => { loadMembers(); loadAvec(); loadAvecStats(); }}
      />
    </div>
  );
}
