import { SupabaseClient } from "@supabase/supabase-js";
import {
  AdminMetrics,
  Attendance,
  CreditRecord,
  Member,
  MemberWithBalance,
  MonthlyData,
  PointRecord,
} from "./types";

// ─── Saldos ─────────────────────────────────────────────────────────────────

export async function getMemberPointsBalance(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("im_club_pontos")
    .select("pontos")
    .eq("cliente_id", cliente_id)
    .eq("utilizado", false)
    .or(`expira_em.is.null,expira_em.gt.${now}`);

  if (!data) return 0;
  return data.reduce((sum, r) => sum + (r.pontos ?? 0), 0);
}

export async function getMemberCreditBalance(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<number> {
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("im_club_creditos")
    .select("valor")
    .eq("cliente_id", cliente_id)
    .eq("utilizado", false)
    .or(`expira_em.is.null,expira_em.gt.${now}`);

  if (!data) return 0;
  return data.reduce((sum, r) => sum + (r.valor ?? 0), 0);
}

// ─── Perfil do membro ────────────────────────────────────────────────────────

export async function getMemberByClienteId(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<Member | null> {
  const { data } = await supabase
    .from("im_club_membros")
    .select("*")
    .eq("cliente_id", cliente_id)
    .single();
  return data ?? null;
}

export async function getMemberByAuthUserId(
  supabase: SupabaseClient,
  auth_user_id: string
): Promise<Member | null> {
  const { data } = await supabase
    .from("im_club_membros")
    .select("*")
    .eq("auth_user_id", auth_user_id)
    .maybeSingle();
  return data ?? null;
}

export async function getMemberByEmail(
  supabase: SupabaseClient,
  email: string
): Promise<Member | null> {
  const { data } = await supabase
    .from("im_club_membros")
    .select("*")
    .eq("email", email)
    .maybeSingle();
  return data ?? null;
}

// Lookup em cascata: auth_user_id → email
export async function getMemberForUser(
  supabase: SupabaseClient,
  userId: string,
  email?: string | null
): Promise<Member | null> {
  const byId = await getMemberByAuthUserId(supabase, userId);
  if (byId) return byId;
  if (email) return getMemberByEmail(supabase, email);
  return null;
}

// ─── Lista de membros (admin) ────────────────────────────────────────────────

export async function listMembers(
  supabase: SupabaseClient,
  {
    page = 1,
    pageSize = 20,
    search = "",
  }: { page?: number; pageSize?: number; search?: string }
): Promise<{ data: Member[]; count: number }> {
  let query = supabase
    .from("im_club_membros")
    .select("*", { count: "exact" })
    .order("criado_em", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.or(
      `cliente_nome.ilike.%${search}%,cliente_id.ilike.%${search}%,cliente_telefone.ilike.%${search}%`
    );
  }

  const { data, count } = await query;
  return { data: data ?? [], count: count ?? 0 };
}

export async function getMemberWithBalance(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<MemberWithBalance | null> {
  const member = await getMemberByClienteId(supabase, cliente_id);
  if (!member) return null;

  const [pontos, credito] = await Promise.all([
    getMemberPointsBalance(supabase, cliente_id),
    getMemberCreditBalance(supabase, cliente_id),
  ]);

  return { ...member, pontos_disponiveis: pontos, credito_disponivel: credito };
}

// ─── Pontos e créditos ───────────────────────────────────────────────────────

export async function getMemberPoints(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<PointRecord[]> {
  const { data } = await supabase
    .from("im_club_pontos")
    .select("*")
    .eq("cliente_id", cliente_id)
    .order("criado_em", { ascending: false });
  return data ?? [];
}

export async function getMemberCredits(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<CreditRecord[]> {
  const { data } = await supabase
    .from("im_club_creditos")
    .select("*")
    .eq("cliente_id", cliente_id)
    .order("criado_em", { ascending: false });
  return data ?? [];
}

export async function getExpiringPoints(
  supabase: SupabaseClient,
  cliente_id: string,
  daysAhead = 30
): Promise<PointRecord[]> {
  const now = new Date();
  const limit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
  const { data } = await supabase
    .from("im_club_pontos")
    .select("*")
    .eq("cliente_id", cliente_id)
    .eq("utilizado", false)
    .gt("expira_em", now.toISOString())
    .lte("expira_em", limit.toISOString());
  return data ?? [];
}

// ─── Atendimentos ────────────────────────────────────────────────────────────

export async function getMemberAttendances(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<Attendance[]> {
  const { data } = await supabase
    .from("im_club_comandas_processadas")
    .select("*")
    .eq("cliente_id", cliente_id)
    .order("processado_em", { ascending: false });
  return data ?? [];
}

export async function getRecentAttendances(
  supabase: SupabaseClient,
  limit = 10
): Promise<Attendance[]> {
  const { data } = await supabase
    .from("im_club_comandas_processadas")
    .select("*")
    .order("processado_em", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ─── Indicações ──────────────────────────────────────────────────────────────

export async function getMemberReferrals(
  supabase: SupabaseClient,
  cliente_id: string
): Promise<Member[]> {
  const { data } = await supabase
    .from("im_club_membros")
    .select("*")
    .eq("indicada_por_id", cliente_id)
    .order("criado_em", { ascending: false });
  return data ?? [];
}

// ─── Métricas admin ──────────────────────────────────────────────────────────

export async function getAdminMetrics(
  supabase: SupabaseClient
): Promise<AdminMetrics> {
  const { data } = await supabase.rpc("get_admin_metrics").single();
  const row = data as { total_ativos: number; total_pendentes: number; total_credito: number; total_pontos: number } | null;
  return {
    totalAtivos: Number(row?.total_ativos ?? 0),
    totalPendentes: Number(row?.total_pendentes ?? 0),
    totalCredito: Number(row?.total_credito ?? 0),
    totalPontos: Number(row?.total_pontos ?? 0),
  };
}

export async function getMembersPerMonth(
  supabase: SupabaseClient
): Promise<MonthlyData[]> {
  const { data } = await supabase.rpc("get_members_per_month");
  return (data ?? []).map((r: { month: string; count: number }) => ({
    month: r.month,
    count: Number(r.count),
  }));
}

// ─── Ações admin ──────────────────────────────────────────────────────────────

export async function updateMemberStatus(
  supabase: SupabaseClient,
  cliente_id: string,
  status: string
) {
  return supabase
    .from("im_club_membros")
    .update({ status })
    .eq("cliente_id", cliente_id);
}

export async function addMemberPoints(
  supabase: SupabaseClient,
  {
    cliente_id,
    cliente_nome,
    pontos,
    origem,
    expira_em,
  }: {
    cliente_id: string;
    cliente_nome?: string;
    pontos: number;
    origem: string;
    expira_em?: string;
  }
) {
  return supabase.from("im_club_pontos").insert({
    cliente_id,
    cliente_nome: cliente_nome ?? null,
    cliente_telefone: cliente_id,
    pontos,
    origem,
    utilizado: false,
    expira_em: expira_em ?? null,
  });
}

export async function addMemberCredit(
  supabase: SupabaseClient,
  {
    cliente_id,
    cliente_nome,
    valor,
    origem,
    expira_em,
  }: {
    cliente_id: string;
    cliente_nome?: string;
    valor: number;
    origem?: string;
    expira_em?: string;
  }
) {
  return supabase.from("im_club_creditos").insert({
    cliente_id,
    cliente_nome: cliente_nome ?? null,
    cliente_telefone: cliente_id,
    valor,
    origem: origem ?? "manual",
    utilizado: false,
    expira_em: expira_em ?? null,
  });
}

export async function createMember(
  supabase: SupabaseClient,
  member: {
    cliente_id: string;
    cliente_nome: string;
    cliente_telefone?: string;
    tipo: string;
    status: string;
    indicada_por_id?: string | null;
    indicada_por_nome?: string | null;
    email?: string | null;
  }
) {
  return supabase.from("im_club_membros").insert(member);
}

export async function linkAuthUser(
  supabase: SupabaseClient,
  cliente_id: string,
  auth_user_id: string,
  email: string
) {
  return supabase
    .from("im_club_membros")
    .update({ auth_user_id, email })
    .eq("cliente_id", cliente_id);
}

export async function expireCredit(
  supabase: SupabaseClient,
  creditId: string
) {
  return supabase
    .from("im_club_creditos")
    .update({ utilizado: true })
    .eq("id", creditId);
}

// ─── Relatórios ───────────────────────────────────────────────────────────────

export async function getMembersNeverUsedCredit(
  supabase: SupabaseClient
): Promise<Member[]> {
  const { data: usedIds } = await supabase
    .from("im_club_creditos")
    .select("cliente_id")
    .eq("utilizado", true);

  const usedSet = new Set((usedIds ?? []).map((r) => r.cliente_id));

  const { data } = await supabase
    .from("im_club_membros")
    .select("*")
    .eq("status", "ativo");

  return (data ?? []).filter((m) => !usedSet.has(m.cliente_id));
}

export async function getMembersWithExpiringPoints(
  supabase: SupabaseClient,
  daysAhead = 30
): Promise<{ member: Member; pontosExpirando: number }[]> {
  const now = new Date();
  const limit = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const { data } = await supabase
    .from("im_club_pontos")
    .select("cliente_id, pontos, expira_em")
    .eq("utilizado", false)
    .gt("expira_em", now.toISOString())
    .lte("expira_em", limit.toISOString());

  if (!data || data.length === 0) return [];

  const byClient: Record<string, number> = {};
  data.forEach((r) => {
    byClient[r.cliente_id] = (byClient[r.cliente_id] ?? 0) + r.pontos;
  });

  const ids = Object.keys(byClient);
  const { data: members } = await supabase
    .from("im_club_membros")
    .select("*")
    .in("cliente_id", ids);

  return (members ?? []).map((m) => ({
    member: m,
    pontosExpirando: byClient[m.cliente_id] ?? 0,
  }));
}

// ─── Saldos em lote (para tabela de clientes) ────────────────────────────────

export async function getMemberBalancesBatch(
  supabase: SupabaseClient,
  clienteIds: string[]
): Promise<Record<string, { pontos: number; credito: number }>> {
  if (clienteIds.length === 0) return {};
  const now = new Date().toISOString();

  const [{ data: pts }, { data: creds }] = await Promise.all([
    supabase
      .from("im_club_pontos")
      .select("cliente_id, pontos")
      .in("cliente_id", clienteIds)
      .eq("utilizado", false)
      .or(`expira_em.is.null,expira_em.gt.${now}`),
    supabase
      .from("im_club_creditos")
      .select("cliente_id, valor")
      .in("cliente_id", clienteIds)
      .eq("utilizado", false)
      .or(`expira_em.is.null,expira_em.gt.${now}`),
  ]);

  const result: Record<string, { pontos: number; credito: number }> = {};
  clienteIds.forEach((id) => { result[id] = { pontos: 0, credito: 0 }; });
  (pts ?? []).forEach((r) => { result[r.cliente_id] = { ...result[r.cliente_id], pontos: (result[r.cliente_id]?.pontos ?? 0) + (r.pontos ?? 0) }; });
  (creds ?? []).forEach((r) => { result[r.cliente_id] = { ...result[r.cliente_id], credito: (result[r.cliente_id]?.credito ?? 0) + (r.valor ?? 0) }; });
  return result;
}

// ─── Busca para campo de indicação ───────────────────────────────────────────

export async function searchMembers(
  supabase: SupabaseClient,
  query: string,
  limit = 10
): Promise<Member[]> {
  const { data } = await supabase
    .from("im_club_membros")
    .select("*")
    .or(
      `cliente_nome.ilike.%${query}%,cliente_id.ilike.%${query}%,cliente_telefone.ilike.%${query}%`
    )
    .limit(limit);
  return data ?? [];
}
