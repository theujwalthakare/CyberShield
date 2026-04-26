import { NextResponse } from "next/server";
import { updateCaseStatusInDb } from "@/lib/api";
import { getServerUserAndRole } from "@/lib/supabase-server";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  const { user, role } = await getServerUserAndRole();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!role || (role !== "officer" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { caseId } = await context.params;

  try {
    const body = (await request.json()) as { status?: string };
    const status = typeof body.status === "string" ? body.status : "";

    if (!status.trim()) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updated = await updateCaseStatusInDb(caseId, status);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update status";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
