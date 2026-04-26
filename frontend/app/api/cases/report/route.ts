import { NextResponse } from "next/server";
import { createCaseFromReport } from "@/lib/api";
import { getServerUserAndRole } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const { user, role } = await getServerUserAndRole();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!role || (role !== "citizen" && role !== "officer" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const payload = (await request.json()) as Record<string, unknown>;

    const created = await createCaseFromReport({
      title: typeof payload.title === "string" ? payload.title : undefined,
      description: typeof payload.description === "string" ? payload.description : undefined,
      crime_type: typeof payload.crime_type === "string" ? payload.crime_type : undefined,
      incident_date: typeof payload.incident_date === "string" ? payload.incident_date : undefined,
      financial_loss:
        typeof payload.financial_loss === "number"
          ? payload.financial_loss
          : Number(payload.financial_loss ?? 0),
      affected_platform:
        typeof payload.affected_platform === "string"
          ? payload.affected_platform
          : undefined,
      district: typeof payload.district === "string" ? payload.district : undefined,
      state: typeof payload.state === "string" ? payload.state : undefined,
      authSubject: user.id,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create case";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
