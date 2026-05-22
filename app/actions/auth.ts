"use server";

import { createClient as createServiceClient } from "@supabase/supabase-js";

// Admin client com service_role — só usar em server actions
function getAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function createAuthUser(email: string, clienteId: string) {
  const admin = getAdminClient();

  // Cria o usuário com senha temporária aleatória
  const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!";
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  if (error) return { error: error.message };

  // Vincula o auth_user_id ao membro
  await admin
    .from("im_club_membros")
    .update({ auth_user_id: data.user.id, email })
    .eq("cliente_id", clienteId);

  return { userId: data.user.id };
}

export async function sendPasswordResetEmail(email: string) {
  const admin = getAdminClient();

  // Gera link de reset — cliente define a própria senha no primeiro acesso
  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/login/nova-senha`,
    },
  });

  if (error) return { error: error.message };
  return { link: data.properties?.action_link };
}

export async function deleteAuthUser(userId: string) {
  const admin = getAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };
  return { success: true };
}
