import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/auth"
import { readSubmissions } from "@/lib/storage"

export async function GET(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const submissions = readSubmissions()

  // Return lightweight list (omit heavy signature data URLs)
  const list = submissions.map(s => ({
    id: s.id,
    status: s.status,
    fullName: s.formData.fullName || "",
    email: s.formData.email || "",
    studentId: s.formData.studentId || "",
    submittedAt: s.submittedAt,
    approvedAt: s.approvedAt,
  }))

  return NextResponse.json({ submissions: list })
}
