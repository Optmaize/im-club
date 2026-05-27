"use client";

import { useState, useEffect, useCallback } from "react";
import { adminFetchPoints, adminFetchCredits } from "@/app/actions/admin-queries";
import { expireCredit } from "@/lib/queries";
import { createClient } from "@/lib/supabase/client";
import { PointRecord, CreditRecord } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 50;

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function fmtDate(d: string) {
  return format(new Date(d), "dd/MM/yyyy", { locale: ptBR });
}

function isExpired(expira_em: string | null) {
  return expira_em ? new Date(expira_em) < new Date() : false;
}

function pointStatus(p: { utilizado: boolean | null; expira_em: string | null }) {
  if (p.utilizado) return { label: "usado", cls: "text-muted-foreground border-muted" };
  if (isExpired(p.expira_em)) return { label: "expirado", cls: "text-red-600 border-red-200" };
  return { label: "ativo", cls: "text-emerald-600 border-emerald-200" };
}

export default function PontosPage() {
  const [points, setPoints] = useState<PointRecord[]>([]);
  const [credits, setCredits] = useState<CreditRecord[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [pagePoints, setPagePoints] = useState(1);
  const [pageCredits, setPageCredits] = useState(1);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [loadingCredits, setLoadingCredits] = useState(true);
  const [searchPoints, setSearchPoints] = useState("");
  const [searchCredits, setSearchCredits] = useState("");
  const [expiringId, setExpiringId] = useState<string | null>(null);

  const loadPoints = useCallback(async () => {
    setLoadingPoints(true);
    const { data, count } = await adminFetchPoints(pagePoints, searchPoints);
    setPoints(data);
    setTotalPoints(count);
    setLoadingPoints(false);
  }, [pagePoints, searchPoints]);

  const loadCredits = useCallback(async () => {
    setLoadingCredits(true);
    const { data, count } = await adminFetchCredits(pageCredits, searchCredits);
    setCredits(data);
    setTotalCredits(count);
    setLoadingCredits(false);
  }, [pageCredits, searchCredits]);

  useEffect(() => { loadPoints(); }, [loadPoints]);
  useEffect(() => { loadCredits(); }, [loadCredits]);
  useEffect(() => { setPagePoints(1); }, [searchPoints]);
  useEffect(() => { setPageCredits(1); }, [searchCredits]);

  async function handleExpireCredit(id: string) {
    setExpiringId(id);
    const { error } = await expireCredit(createClient(), id);
    setExpiringId(null);
    if (error) toast.error("Erro ao expirar crédito");
    else { toast.success("Crédito expirado"); loadCredits(); }
  }

  const totalPPages = Math.ceil(totalPoints / PAGE_SIZE);
  const totalCPages = Math.ceil(totalCredits / PAGE_SIZE);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-ink">Pontos & Créditos</h1>
        <p className="text-muted-foreground text-sm">Histórico completo de pontos e créditos</p>
      </div>

      <Tabs defaultValue="pontos">
        <TabsList>
          <TabsTrigger value="pontos">Pontos {totalPoints > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({totalPoints})</span>}</TabsTrigger>
          <TabsTrigger value="creditos">Créditos {totalCredits > 0 && <span className="ml-1.5 text-xs text-muted-foreground">({totalCredits})</span>}</TabsTrigger>
        </TabsList>

        {/* ── Tab Pontos ── */}
        <TabsContent value="pontos" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchPoints}
              onChange={(e) => setSearchPoints(e.target.value)}
              placeholder="Filtrar por celular..."
              className="pl-10 bg-white"
            />
          </div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Pontos</TableHead>
                    <TableHead className="text-xs">Origem</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Expira em</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPoints ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : points.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm">Nenhum registro encontrado</TableCell></TableRow>
                  ) : points.map((p) => {
                    const st = pointStatus(p);
                    return (
                      <TableRow key={p.id} className="border-beige">
                        <TableCell className="text-sm text-ink">
                          <p className="font-medium">{p.cliente_nome ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{p.cliente_id}</p>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-ink">+{p.pontos}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{p.origem ?? "—"}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={`text-xs ${st.cls}`}>{st.label}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.expira_em ? fmtDate(p.expira_em) : "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(p.criado_em)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
          {totalPPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">Página {pagePoints} de {totalPPages} · {totalPoints} registros</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPagePoints(p => Math.max(1, p - 1))} disabled={pagePoints === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPagePoints(p => Math.min(totalPPages, p + 1))} disabled={pagePoints === totalPPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Tab Créditos ── */}
        <TabsContent value="creditos" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchCredits}
              onChange={(e) => setSearchCredits(e.target.value)}
              placeholder="Filtrar por celular..."
              className="pl-10 bg-white"
            />
          </div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Cliente</TableHead>
                    <TableHead className="text-xs">Valor</TableHead>
                    <TableHead className="text-xs">Origem</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Expira em</TableHead>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingCredits ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                  ) : credits.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">Nenhum registro encontrado</TableCell></TableRow>
                  ) : credits.map((c) => {
                    const st = pointStatus(c);
                    const expired = c.utilizado || isExpired(c.expira_em);
                    return (
                      <TableRow key={c.id} className="border-beige">
                        <TableCell className="text-sm text-ink">
                          <p className="font-medium">{c.cliente_nome ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{c.cliente_id}</p>
                        </TableCell>
                        <TableCell className="text-sm font-semibold text-gold">{fmt(c.valor)}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{c.origem ?? "—"}</Badge></TableCell>
                        <TableCell><Badge variant="outline" className={`text-xs ${st.cls}`}>{st.label}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.expira_em ? fmtDate(c.expira_em) : "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(c.criado_em)}</TableCell>
                        <TableCell>
                          {!expired && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50" disabled={expiringId === c.id} onClick={() => handleExpireCredit(c.id)}>
                              {expiringId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
          {totalCPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">Página {pageCredits} de {totalCPages} · {totalCredits} registros</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPageCredits(p => Math.max(1, p - 1))} disabled={pageCredits === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={() => setPageCredits(p => Math.min(totalCPages, p + 1))} disabled={pageCredits === totalCPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
