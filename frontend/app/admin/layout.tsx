import { redirect } from "next/navigation";
import { getServerUserAndRole } from "@/lib/supabase-server";
import AdminLayoutClient from "./layout-client";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getServerUserAndRole();
  if (!user) redirect("/sign-in");
  if (role !== "admin") {
    const home: Record<string, string> = {
      officer: "/officer/dashboard",
      citizen: "/citizen/dashboard",
      analyst: "/analyst/dashboard",
    };
    redirect(home[role ?? ""] ?? "/sign-in");
  }
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
