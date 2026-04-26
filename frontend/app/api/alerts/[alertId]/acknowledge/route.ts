import { NextResponse } from "next/server";
import { acknowledgeAlertById } from "@/lib/api";
import { getServerUserAndRole } from "@/lib/supabase-server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ alertId: string }> }
) {
  const { user, role } = await getServerUserAndRole();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!role || (role !== "officer" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { alertId } = await context.params;
  const parsedAlertId = Number(alertId);

  if (!Number.isFinite(parsedAlertId) || parsedAlertId <= 0) {
    return NextResponse.json({ error: "Invalid alert id" }, { status: 400 });
  }

  try {
    const result = await acknowledgeAlertById(parsedAlertId);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to acknowledge alert";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
