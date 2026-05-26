export type MemberStatus = "ativo" | "pendente" | "recusado";
export type MemberType = "embaixadora" | "indicada" | "cliente_antiga";
export type PointOrigin = "atendimento" | "boas_vindas" | "indicacao" | "manual";

// Matches actual im_club_membros schema
export interface Member {
  id: string;
  cliente_id: string;       // celular limpo (identificador único)
  cliente_nome: string;
  cliente_telefone: string | null;
  tipo: MemberType | null;
  indicada_por_id: string | null;
  indicada_por_nome: string | null;
  status: MemberStatus | null;
  criado_em: string;
  email: string | null;
  auth_user_id: string | null;
}

export interface MemberWithBalance extends Member {
  pontos_disponiveis: number;
  credito_disponivel: number;
}

// Matches actual im_club_pontos schema
export interface PointRecord {
  id: string;
  cliente_id: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  pontos: number;
  origem: string | null;
  expira_em: string | null;
  utilizado: boolean | null;
  criado_em: string;
}

// Matches actual im_club_creditos schema
export interface CreditRecord {
  id: string;
  cliente_id: string;
  cliente_nome: string | null;
  cliente_telefone: string | null;
  valor: number;
  origem: string | null;
  expira_em: string | null;
  utilizado: boolean | null;
  criado_em: string;
}

// Matches actual im_club_comandas_processadas schema
export interface Attendance {
  id: string;
  comanda_id: string | null;
  cliente_id: string;
  cliente_nome: string | null;
  valor: number | null;
  processado_em: string | null;
}

// ─── AVEC ─────────────────────────────────────────────────────────────────────

export interface AvecCliente {
  id: string;
  cliente_id: string; // internal AVEC ID (not phone)
  nome: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null; // phone = im_club_membros.cliente_id
  aniversario: string | null;
  sincronizado_em: string | null;
  atualizado_em: string | null;
}

export interface AvecClienteWithStatus extends AvecCliente {
  im_status: MemberStatus | null;
  im_tipo: MemberType | null;
}

export type AvecFilter = "todos" | "no_clube" | "fora_clube" | "aniversariantes";

// ─── Admin metrics ────────────────────────────────────────────────────────────

export interface AdminMetrics {
  totalAtivos: number;
  totalPendentes: number;
  totalCredito: number;
  totalPontos: number;
}

export interface MonthlyData {
  month: string;
  count: number;
}
