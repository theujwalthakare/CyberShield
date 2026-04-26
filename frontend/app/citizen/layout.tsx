import { redirect } from "next/navigation";
import { getServerUserAndRole } from "@/lib/supabase-server";
import CitizenLayoutClient from "./layout-client";

export default async function CitizenLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getServerUserAndRole();
  if (!user) redirect("/sign-in");
  if (role !== "citizen") {
    const home: Record<string, string> = {
      admin: "/admin/dashboard",
      officer: "/officer/dashboard",
      analyst: "/analyst/dashboard",
    };
    redirect(home[role ?? ""] ?? "/sign-in");
  }
  return <CitizenLayoutClient>{children}</CitizenLayoutClient>;
}
