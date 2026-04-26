import { redirect } from "next/navigation";
import { getServerUserAndRole } from "@/lib/supabase-server";
import AnalystLayoutClient from "./layout-client";

export default async function AnalystLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getServerUserAndRole();
  if (!user) redirect("/sign-in");
  if (role !== "analyst") {
    const home: Record<string, string> = {
      admin: "/admin/dashboard",
      citizen: "/citizen/dashboard",
      officer: "/officer/dashboard",
    };
    redirect(home[role ?? ""] ?? "/sign-in");
  }
  return <AnalystLayoutClient>{children}</AnalystLayoutClient>;
}
