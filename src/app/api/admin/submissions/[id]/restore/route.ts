import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/auth"
import { updateSubmission } from "@/lib/storage"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // To restore, we set deletedAt to null
  const updated = await updateSubmission(id, { deletedAt: null })

  if (!updated) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true, submission: updated })
}
