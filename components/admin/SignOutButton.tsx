"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium"
      style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}
    >
      <LogOut size={14} />
      Sign out
    </button>
  );
}
