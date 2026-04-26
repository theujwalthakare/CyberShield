import { redirect } from "next/navigation";
import { getServerUserAndRole } from "@/lib/supabase-server";
import OfficerLayoutClient from "./layout-client";

export default async function OfficerLayout({ children }: { children: React.ReactNode }) {
  const { user, role } = await getServerUserAndRole();
  if (!user) redirect("/sign-in");
  if (role !== "officer") {
    const home: Record<string, string> = {
      admin: "/admin/dashboard",
      citizen: "/citizen/dashboard",
      analyst: "/analyst/dashboard",
    };
    redirect(home[role ?? ""] ?? "/sign-in");
  }
  return <OfficerLayoutClient>{children}</OfficerLayoutClient>;
}
