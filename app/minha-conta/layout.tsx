import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMemberForUser } from "@/lib/queries";
import { redirect } from "next/navigation";
import { ClienteHeader } from "@/components/cliente/ClienteHeader";
import { ClienteNav } from "@/components/cliente/ClienteNav";

export default async function MinhaContaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();
  const member = await getMemberForUser(admin, user.id, user.email);

  if (!member) redirect("/login");
  if (member.status === "pendente") redirect("/aguardando");
  if (member.status !== "ativo") redirect("/login?error=inactive");

  return (
    <div className="min-h-screen bg-beige flex flex-col max-w-md mx-auto relative">
      <ClienteHeader nome={member.cliente_nome} />
      <main className="flex-1 pb-24 overflow-auto">{children}</main>
      <ClienteNav />
    </div>
  );
}
