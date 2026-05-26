"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  PointRecord, CreditRecord, Member, Attendance, MemberWithBalance,
  AvecClienteWithStatus, AvecFilter, MemberStatus, MemberType,
} from "@/lib/types";

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

// ─── Criação de membro (admin, bypass RLS) ───────────────────────────────────

async function awardReferralPoints(
  referrerId: string,
  referrerNome: string | null
): Promise<void> {
  const expira = new Date();
  expira.setFullYear(expira.getFullYear() + 1);
  await db().from("im_club_pontos").insert({
    cliente_id: referrerId,
    cliente_nome: referrerNome ?? null,
    cliente_telefone: referrerId,
    pontos: 300,
    origem: "indicacao",
    utilizado: false,
    expira_em: expira.toISOString(),
  });
}

export async function adminCreateMember(member: {
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone?: string;
  tipo: MemberType;
  status: MemberStatus;
  indicada_por_id?: string | null;
  indicada_por_nome?: string | null;
  email?: string | null;
}): Promise<{ success: boolean; error?: string }> {
  const { error } = await db().from("im_club_membros").insert({
    ...member,
    cliente_telefone: member.cliente_telefone ?? member.cliente_id,
  });
  if (error) return { success: false, error: error.message };

  if (member.status === "ativo" && member.indicada_por_id) {
    await awardReferralPoints(member.indicada_por_id, member.indicada_por_nome ?? null);
  }

  return { success: true };
}

// ─── AVEC Clientes ────────────────────────────────────────────────────────────

const AVEC_PAGE_SIZE = 30;

function getBirthdayMonth(aniversario: string | null | undefined): number | null {
  if (!aniversario?.trim()) return null;
  const parts = aniversario.trim().split("/");
  if (parts.length >= 2) {
    const m = parseInt(parts[1], 10);
    if (!isNaN(m) && m >= 1 && m <= 12) return m;
  }
  return null;
}

export async function fetchAvecStats(): Promise<{
  total: number;
  noClube: number;
  aniversariantesMes: number;
}> {
  const admin = db();
  const currentMonth = new Date().getMonth() + 1;

  const [{ count: total }, { data: memberRows }, { data: avecRows }] = await Promise.all([
    admin.from("avec_clientes").select("*", { count: "exact", head: true }),
    admin.from("im_club_membros").select("cliente_id"),
    admin.from("avec_clientes").select("celular, aniversario"),
  ]);

  const memberIds = new Set((memberRows ?? []).map((m) => m.cliente_id));
  const rows = avecRows ?? [];

  return {
    total: total ?? 0,
    noClube: rows.filter((a) => a.celular && memberIds.has(a.celular)).length,
    aniversariantesMes: rows.filter((a) => getBirthdayMonth(a.aniversario) === currentMonth).length,
  };
}

export async function fetchAvecClientes(
  page: number,
  search: string,
  filter: AvecFilter
): Promise<{ data: AvecClienteWithStatus[]; count: number }> {
  const admin = db();
  const currentMonth = new Date().getMonth() + 1;

  const { data: memberRows } = await admin
    .from("im_club_membros")
    .select("cliente_id, status, tipo");

  const memberMap = new Map(
    (memberRows ?? []).map((m) => [
      m.cliente_id,
      { status: m.status as MemberStatus, tipo: m.tipo as MemberType },
    ])
  );
  const memberIds = Array.from(memberMap.keys());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enrich = (rows: any[]): AvecClienteWithStatus[] =>
    rows.map((a) => ({
      ...a,
      im_status: memberMap.get(a.celular ?? "")?.status ?? null,
      im_tipo: memberMap.get(a.celular ?? "")?.tipo ?? null,
    }));

  if (filter === "aniversariantes") {
    let q = admin.from("avec_clientes").select("*").order("nome");
    if (search) q = q.or(`nome.ilike.%${search}%,celular.ilike.%${search}%`);
    const { data: all } = await q;
    const filtered = (all ?? []).filter(
      (a) => getBirthdayMonth(a.aniversario) === currentMonth
    );
    const paged = filtered.slice((page - 1) * AVEC_PAGE_SIZE, page * AVEC_PAGE_SIZE);
    return { data: enrich(paged), count: filtered.length };
  }

  let q = admin
    .from("avec_clientes")
    .select("*", { count: "exact" })
    .order("nome")
    .range((page - 1) * AVEC_PAGE_SIZE, page * AVEC_PAGE_SIZE - 1);

  if (search) q = q.or(`nome.ilike.%${search}%,celular.ilike.%${search}%`);

  if (filter === "no_clube") {
    if (memberIds.length === 0) return { data: [], count: 0 };
    q = q.in("celular", memberIds);
  } else if (filter === "fora_clube" && memberIds.length > 0) {
    q = q.or(`celular.is.null,celular.not.in.(${memberIds.join(",")})`);
  }

  const { data, count } = await q;
  return { data: enrich((data ?? []) as Record<string, unknown>[]), count: count ?? 0 };
}

export async function enrollAvecClienteInClub(
  avec: { celular: string; nome: string; email?: string | null },
  options: {
    tipo: MemberType;
    status: MemberStatus;
    indicadaPorId?: string | null;
    indicadaPorNome?: string | null;
    pontosBoasVindas?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const admin = db();
  const celular = avec.celular.replace(/\D/g, "");

  const { error } = await admin.from("im_club_membros").insert({
    cliente_id: celular,
    cliente_nome: avec.nome,
    cliente_telefone: celular,
    tipo: options.tipo,
    status: options.status,
    indicada_por_id: options.indicadaPorId ?? null,
    indicada_por_nome: options.indicadaPorNome ?? null,
    email: avec.email ?? null,
  });

  if (error) return { success: false, error: error.message };

  if (options.pontosBoasVindas && options.pontosBoasVindas > 0) {
    const expira = new Date();
    expira.setFullYear(expira.getFullYear() + 1);
    await admin.from("im_club_pontos").insert({
      cliente_id: celular,
      cliente_nome: avec.nome,
      cliente_telefone: celular,
      pontos: options.pontosBoasVindas,
      origem: "boas_vindas",
      utilizado: false,
      expira_em: expira.toISOString(),
    });
  }

  if (options.status === "ativo" && options.indicadaPorId) {
    await awardReferralPoints(options.indicadaPorId, options.indicadaPorNome ?? null);
  }

  return { success: true };
}

export async function adminUpdateMemberStatus(
  clienteId: string,
  status: MemberStatus
): Promise<{ success: boolean; error?: string }> {
  // When activating, check if there's a referrer who hasn't been rewarded yet
  if (status === "ativo") {
    const { data: current } = await db()
      .from("im_club_membros")
      .select("status, indicada_por_id, indicada_por_nome")
      .eq("cliente_id", clienteId)
      .single();

    if (current && current.status !== "ativo" && current.indicada_por_id) {
      await awardReferralPoints(current.indicada_por_id, current.indicada_por_nome ?? null);
    }
  }

  const { error } = await db()
    .from("im_club_membros")
    .update({ status })
    .eq("cliente_id", clienteId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function adminUpdateMemberTipo(
  clienteId: string,
  tipo: MemberType
): Promise<{ success: boolean; error?: string }> {
  const { error } = await db()
    .from("im_club_membros")
    .update({ tipo })
    .eq("cliente_id", clienteId);
  return error ? { success: false, error: error.message } : { success: true };
}
