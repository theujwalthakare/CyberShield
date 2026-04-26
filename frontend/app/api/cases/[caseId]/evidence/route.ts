import { NextResponse } from "next/server";
import { uploadEvidenceForCase } from "@/lib/api";
import { getServerUserAndRole } from "@/lib/supabase-server";

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(
  request: Request,
  context: { params: Promise<{ caseId: string }> }
) {
  const { user, role } = await getServerUserAndRole();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!role || (role !== "citizen" && role !== "officer" && role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { caseId } = await context.params;

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const annotation = formData.get("annotation");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Evidence file is required" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 10 MB limit" },
        { status: 400 }
      );
    }

    const result = await uploadEvidenceForCase({
      caseId,
      file,
      annotation: typeof annotation === "string" ? annotation : undefined,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to upload evidence";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
