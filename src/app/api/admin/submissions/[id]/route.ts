import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/auth"
import { getSubmissionById, updateSubmission, hardDeleteSubmission } from "@/lib/storage"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const submission = await getSubmissionById(id)

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  return NextResponse.json({ submission })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const isPermanent = searchParams.get("permanent") === "true"

  if (isPermanent) {
    const deleted = await hardDeleteSubmission(id)
    if (!deleted) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, message: "Submission permanently deleted" })
  } else {
    const updated = await updateSubmission(id, { deletedAt: new Date().toISOString() })
    if (!updated) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, submission: updated })
  }
}
