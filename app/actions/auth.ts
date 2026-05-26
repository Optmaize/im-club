"use server";

import { createAdminClient } from "@/lib/supabase/admin";

// ─── Cria usuário no Supabase Auth e vincula ao membro ───────────────────────

export async function createAuthUser(
  email: string,
  clienteId: string
): Promise<{ userId?: string; error?: string }> {
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true, // considera email já confirmado
  });

  if (error) {
    // Usuário já existe — busca e vincula
    if (error.status === 422 || error.message.toLowerCase().includes("already")) {
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
      const existing = list?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      );
      if (existing) {
        await admin
          .from("im_club_membros")
          .update({ auth_user_id: existing.id, email })
          .eq("cliente_id", clienteId);
        return { userId: existing.id };
      }
    }
    return { error: error.message };
  }

  await admin
    .from("im_club_membros")
    .update({ auth_user_id: data.user.id, email })
    .eq("cliente_id", clienteId);

  return { userId: data.user.id };
}

// ─── Define senha diretamente (Isa configura para a cliente) ─────────────────

export async function setMemberPassword(
  authUserId: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(authUserId, { password });
  return error ? { success: false, error: error.message } : { success: true };
}

// ─── Envia email com link de redefinição de senha ────────────────────────────

export async function sendPasswordResetEmail(
  email: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/nova-senha`,
  });
  return { error: error?.message };
}

// ─── Envia magic link (acesso sem senha) ─────────────────────────────────────

export async function sendMagicLink(
  email: string
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const { error } = await admin.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  return { error: error?.message };
}

// ─── Atualiza email do membro (tabela + auth) ────────────────────────────────

export async function updateMemberEmail(
  clienteId: string,
  authUserId: string | null,
  newEmail: string
): Promise<{ success: boolean; error?: string }> {
  const admin = createAdminClient();

  const { error: dbError } = await admin
    .from("im_club_membros")
    .update({ email: newEmail })
    .eq("cliente_id", clienteId);
  if (dbError) return { success: false, error: dbError.message };

  if (authUserId) {
    await admin.auth.admin.updateUserById(authUserId, { email: newEmail });
  }

  return { success: true };
}

// ─── Remove auth user (usado ao excluir membro) ───────────────────────────────

export async function deleteAuthUser(userId: string) {
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  return error ? { error: error.message } : { success: true };
}
