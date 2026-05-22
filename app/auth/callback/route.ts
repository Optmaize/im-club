import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/queries";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const user = data.user;

  // Vincula auth_user_id ao membro se ainda não vinculado
  const admin = createAdminClient();
  const member = await getMemberForUser(admin, user.id, user.email);
  if (member && !member.auth_user_id) {
    await admin
      .from("im_club_membros")
      .update({ auth_user_id: user.id, email: user.email ?? member.email })
      .eq("cliente_id", member.cliente_id);
  }

  const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  const isAdmin =
    user.email === adminEmail || user.user_metadata?.role === "admin";

  return NextResponse.redirect(`${origin}${isAdmin ? "/admin" : "/minha-conta"}`);
}
