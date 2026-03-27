import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/auth"
import { getSubmissionById, updateSubmission, type AdminData } from "@/lib/storage"

// Update admin-only data (Start Date, Catalog Date, notes, etc.) without sending emails.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const submission = await getSubmissionById(id)

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  const body = await request.json()
  const adminData = body.adminData as Partial<AdminData> | undefined

  if (!adminData) {
    return NextResponse.json({ error: "Missing adminData" }, { status: 400 })
  }

  const mergedAdmin: AdminData = {
    ...(submission.adminData || {
      adminName: "",
      notes: "",
    }),
    ...adminData,
  }

  const updated = await updateSubmission(id, {
    adminData: mergedAdmin,
  })

  return NextResponse.json({ success: true, submission: updated })
}

