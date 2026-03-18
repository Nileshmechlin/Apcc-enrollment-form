import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/auth"
import { getSubmissionById } from "@/lib/storage"
import { generatePDF } from "@/lib/pdf"

// Generate a fresh PDF for a submission using current data.
// Used by admins to download updated agreements; does NOT send any emails.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const submission = getSubmissionById(id)

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  const pdfBuffer = await generatePDF(
    submission.formData,
    submission.signatureDataUrl,
    submission.adminData || undefined,
    submission.adminSignatureDataUrl || undefined,
    submission.parentSignatureDataUrl ?? undefined,
  )

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agreement-${id}.pdf"`,
    },
  })
}

