import { redirect } from "next/navigation";
import { getServerUserAndRole } from "@/lib/supabase-server";
import { getLegacyDashboardRedirectPath } from "@/lib/legacy-dashboard";

export default async function ReportPage() {
  const { role } = await getServerUserAndRole();
  redirect(getLegacyDashboardRedirectPath(role, ["report"]));
}
