"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { PointRecord, CreditRecord, Member, Attendance, MemberWithBalance } from "@/lib/types";

const PAGE_SIZE = 50;

function db() {
  return createAdminClient();
}

// ─── Admin: todos os pontos/créditos (bypass RLS) ────────────────────────────

export async function adminFetchPoints(
  page: number,
  search: string
): Promise<{ data: PointRecord[]; count: number }> {
  let q = db()
    .from("im_club_pontos")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (search) q = q.ilike("cliente_id", `%${search}%`);
  const { data, count } = await q;
  return { data: data ?? [], count: count ?? 0 };
}

export async function adminFetchCredits(
  page: number,
  search: string
): Promise<{ data: CreditRecord[]; count: number }> {
  let q = db()
    .from("im_club_creditos")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (search) q = q.ilike("cliente_id", `%${search}%`);
  const { data, count } = await q;
  return { data: data ?? [], count: count ?? 0 };
}

// ─── Dados de um membro específico (bypass RLS) ──────────────────────────────

export async function fetchMemberWithBalance(
  clienteId: string
): Promise<MemberWithBalance | null> {
  const { data: member } = await db()
    .from("im_club_membros")
    .select("*")
    .eq("cliente_id", clienteId)
    .single();
  if (!member) return null;

  const now = new Date().toISOString();
  const [{ data: pts }, { data: creds }] = await Promise.all([
    db()
      .from("im_club_pontos")
      .select("pontos")
      .eq("cliente_id", clienteId)
      .eq("utilizado", false)
      .or(`expira_em.is.null,expira_em.gt.${now}`),
    db()
      .from("im_club_creditos")
      .select("valor")
      .eq("cliente_id", clienteId)
      .eq("utilizado", false)
      .or(`expira_em.is.null,expira_em.gt.${now}`),
  ]);

  return {
    ...member,
    pontos_disponiveis: (pts ?? []).reduce((s, r) => s + (r.pontos ?? 0), 0),
    credito_disponivel: (creds ?? []).reduce((s, r) => s + (r.valor ?? 0), 0),
  };
}

export async function fetchMemberPoints(clienteId: string): Promise<PointRecord[]> {
  const { data } = await db()
    .from("im_club_pontos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });
  return data ?? [];
}

export async function fetchMemberCredits(clienteId: string): Promise<CreditRecord[]> {
  const { data } = await db()
    .from("im_club_creditos")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false });
  return data ?? [];
}

export async function fetchMemberAttendances(clienteId: string): Promise<Attendance[]> {
  const { data } = await db()
    .from("im_club_comandas_processadas")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("processado_em", { ascending: false });
  return data ?? [];
}

export async function fetchMemberReferrals(clienteId: string): Promise<Member[]> {
  const { data } = await db()
    .from("im_club_membros")
    .select("*")
    .eq("indicada_por_id", clienteId)
    .order("criado_em", { ascending: false });
  return data ?? [];
}

// ─── Saldos em lote (tabela de clientes) ─────────────────────────────────────

export async function fetchMemberBalancesBatch(
  clienteIds: string[]
): Promise<Record<string, { pontos: number; credito: number }>> {
  if (clienteIds.length === 0) return {};
  const now = new Date().toISOString();

  const [{ data: pts }, { data: creds }] = await Promise.all([
    db()
      .from("im_club_pontos")
      .select("cliente_id, pontos")
      .in("cliente_id", clienteIds)
      .eq("utilizado", false)
      .or(`expira_em.is.null,expira_em.gt.${now}`),
    db()
      .from("im_club_creditos")
      .select("cliente_id, valor")
      .in("cliente_id", clienteIds)
      .eq("utilizado", false)
      .or(`expira_em.is.null,expira_em.gt.${now}`),
  ]);

  const result: Record<string, { pontos: number; credito: number }> = {};
  clienteIds.forEach((id) => { result[id] = { pontos: 0, credito: 0 }; });
  (pts ?? []).forEach((r) => { result[r.cliente_id].pontos += r.pontos ?? 0; });
  (creds ?? []).forEach((r) => { result[r.cliente_id].credito += r.valor ?? 0; });
  return result;
}

// ─── Saldo individual + pontos expirando (minha-conta) ───────────────────────

export async function fetchMemberPointsBalance(clienteId: string): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await db()
    .from("im_club_pontos")
    .select("pontos")
    .eq("cliente_id", clienteId)
    .eq("utilizado", false)
    .or(`expira_em.is.null,expira_em.gt.${now}`);
  return (data ?? []).reduce((s, r) => s + (r.pontos ?? 0), 0);
}

export async function fetchMemberCreditBalance(clienteId: string): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await db()
    .from("im_club_creditos")
    .select("valor")
    .eq("cliente_id", clienteId)
    .eq("utilizado", false)
    .or(`expira_em.is.null,expira_em.gt.${now}`);
  return (data ?? []).reduce((s, r) => s + (r.valor ?? 0), 0);
}

export async function fetchExpiringPoints(
  clienteId: string,
  daysAhead = 30
): Promise<PointRecord[]> {
  const now = new Date();
  const limit = new Date(now.getTime() + daysAhead * 86400000);
  const { data } = await db()
    .from("im_club_pontos")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("utilizado", false)
    .gt("expira_em", now.toISOString())
    .lte("expira_em", limit.toISOString())
    .order("expira_em", { ascending: true });
  return data ?? [];
}

export async function fetchExpiringCredits(
  clienteId: string,
  daysAhead = 30
): Promise<CreditRecord[]> {
  const now = new Date();
  const limit = new Date(now.getTime() + daysAhead * 86400000);
  const { data } = await db()
    .from("im_club_creditos")
    .select("*")
    .eq("cliente_id", clienteId)
    .eq("utilizado", false)
    .gt("expira_em", now.toISOString())
    .lte("expira_em", limit.toISOString())
    .order("expira_em", { ascending: true });
  return data ?? [];
}
