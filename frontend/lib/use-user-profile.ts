"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function useUserProfile() {
  const [name, setName] = useState("User");
  const [email, setEmail] = useState("");
  const [initials, setInitials] = useState("U");
  const [role, setRole] = useState("");

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("user_profiles")
        .select("full_name, email, role")
        .eq("auth_subject", user.id)
        .maybeSingle()
        .then(({ data }: { data: { full_name: string | null; email: string | null; role: string } | null }) => {
          const n = data?.full_name ?? user.email ?? "User";
          const e = data?.email ?? user.email ?? "";
          setName(n);
          setEmail(e);
          setRole(data?.role ?? "");
          setInitials(
            n.split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "U"
          );
        });
    });
  }, []);

  return { name, email, initials, role };
}
