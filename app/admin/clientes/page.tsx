"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { listMembers } from "@/lib/queries";
import {
  fetchMemberWithBalance,
  fetchMemberPoints,
  fetchMemberCredits,
  fetchMemberAttendances,
  fetchMemberReferrals,
  fetchMemberBalancesBatch,
} from "@/app/actions/admin-queries";
import {
  Member,
  MemberWithBalance,
  PointRecord,
  CreditRecord,
  Attendance,
  MemberStatus,
} from "@/lib/types";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { MemberDrawer } from "@/components/admin/MemberDrawer";
import { NewMemberModal } from "@/components/admin/NewMemberModal";
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
import { Search, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDebounce } from "@/lib/hooks";

const PAGE_SIZE = 20;

const typeBadgeConfig: Record<string, { label: string; className: string }> = {
  embaixadora: {
    label: "Embaixadora",
    className: "text-amber-700 border-amber-300 bg-amber-50",
  },
  indicada: {
    label: "Indicada",
    className: "text-blue-600 border-blue-200 bg-blue-50",
  },
  cliente_antiga: {
    label: "Cliente Antiga",
    className: "text-gray-500 border-gray-200 bg-gray-50",
  },
};

function TypeBadge({ tipo }: { tipo: string | null | undefined }) {
  if (!tipo) return <Badge variant="outline" className="text-xs text-muted-foreground">—</Badge>;
  const cfg = typeBadgeConfig[tipo.toLowerCase()] ?? { label: tipo, className: "" };
  return <Badge variant="outline" className={`text-xs ${cfg.className}`}>{cfg.label}</Badge>;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export default function ClientesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [balances, setBalances] = useState<Record<string, { pontos: number; credito: number }>>({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [newModalOpen, setNewModalOpen] = useState(false);

  const [selectedMember, setSelectedMember] = useState<MemberWithBalance | null>(null);
  const [drawerPoints, setDrawerPoints] = useState<PointRecord[]>([]);
  const [drawerCredits, setDrawerCredits] = useState<CreditRecord[]>([]);
  const [drawerAttendances, setDrawerAttendances] = useState<Attendance[]>([]);
  const [drawerReferrals, setDrawerReferrals] = useState<Member[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 350);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, count } = await listMembers(supabase, {
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch,
    });
    setMembers(data);
    setTotal(count);
    setLoading(false);
    if (data.length > 0) {
      const ids = data.map((m) => m.cliente_id);
      const b = await fetchMemberBalancesBatch(ids);
      setBalances(b);
    } else {
      setBalances({});
    }
  }, [page, debouncedSearch]);

  useEffect(() => { loadMembers(); }, [loadMembers]);
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

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-playfair text-2xl font-bold text-ink">Clientes</h1>
          <p className="text-muted-foreground text-sm">
            {total} membro{total !== 1 ? "s" : ""} cadastrado{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setNewModalOpen(true)} className="bg-ink text-gold hover:bg-ink-light gap-2">
          <Plus className="w-4 h-4" />
          Novo membro
        </Button>
      </div>

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
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhum membro encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((m) => {
                    const bal = balances[m.cliente_id];
                    return (
                      <TableRow
                        key={m.cliente_id}
                        className="cursor-pointer hover:bg-beige/50 border-beige transition-colors"
                        onClick={() => openMemberDrawer(m)}
                      >
                        <TableCell className="font-medium text-ink text-sm">{m.cliente_nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.cliente_id}</TableCell>
                        <TableCell><TypeBadge tipo={m.tipo} /></TableCell>
                        <TableCell>
                          <StatusBadge status={(m.status ?? "pendente") as MemberStatus} />
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-ink">
                          {bal != null ? bal.pontos.toLocaleString("pt-BR") : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium text-gold">
                          {bal != null ? formatCurrency(bal.credito) : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.indicada_por_nome ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(m.criado_em), "dd/MM/yyyy", { locale: ptBR })}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
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
        onCreated={loadMembers}
      />
    </div>
  );
}
