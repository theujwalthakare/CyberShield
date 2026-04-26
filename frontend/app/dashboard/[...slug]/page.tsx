import { redirect } from "next/navigation";
import { getServerUserAndRole } from "@/lib/supabase-server";
import { getLegacyDashboardRedirectPath } from "@/lib/legacy-dashboard";

export default async function LegacyDashboardCatchAllPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const { role } = await getServerUserAndRole();
  redirect(getLegacyDashboardRedirectPath(role, slug));
}