import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import SignOutButton from "@/components/admin/SignOutButton";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth — middleware already redirects unauthenticated
  // requests before this ever renders.
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--paper)" }}>
      <header className="border-b" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <span className="text-sm font-extrabold" style={{ color: "var(--ink)" }}>
              AJ FairDeal Realty
            </span>
            <span className="ml-2 text-sm" style={{ color: "var(--ink-2)" }}>
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "var(--ink-2)" }}>
              {profile?.full_name ?? user.email}
              {profile?.role === "admin" ? " · Admin" : ""}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
