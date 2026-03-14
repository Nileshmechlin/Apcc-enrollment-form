import { NextRequest, NextResponse } from "next/server"
import { isAdminAuthenticated } from "@/lib/auth"
import { getSubmissionById, updateSubmission } from "@/lib/storage"
import { generatePDF } from "@/lib/pdf"
import { sendSignedAgreementEmail } from "@/lib/email"
import { appendToSheet } from "@/lib/sheets"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const submission = getSubmissionById(id)

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (submission.status === "approved") {
    return NextResponse.json({ error: "Already approved" }, { status: 409 })
  }

  const body = await request.json()
  const { adminData, adminSignatureDataUrl } = body

  if (!adminData?.adminName || !adminSignatureDataUrl) {
    return NextResponse.json({ error: "Admin name and signature are required" }, { status: 400 })
  }

  // 1. Generate PDF with student, optional parent, and admin signatures
  const pdfBuffer = await generatePDF(
    submission.formData,
    submission.signatureDataUrl,
    adminData,
    adminSignatureDataUrl,
    submission.parentSignatureDataUrl ?? undefined,
  )

  // 2. Send emails
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com"
  try {
    await sendSignedAgreementEmail({
      studentEmail: submission.formData.email,
      studentName: submission.formData.fullName,
      adminEmail,
      adminName: adminData.adminName,
      adminNotes: adminData.notes || "",
      pdfBuffer,
      dateOfBirth: submission.formData.dateOfBirth || undefined,
      parentsName: submission.formData.parentsName || undefined,
    })
  } catch (emailError) {
    console.error("[Approve] Email failed:", emailError)
    // Continue anyway — still mark as approved
  }

  // 3. Log to Google Sheets
  try {
    await appendToSheet(submission.formData)
  } catch (sheetError) {
    console.error("[Approve] Sheets failed:", sheetError)
  }

  // 4. Update submission record
  const updated = updateSubmission(id, {
    status: "approved",
    adminData,
    adminSignatureDataUrl,
    approvedAt: new Date().toISOString(),
  })

  return NextResponse.json({
    success: true,
    submission: updated,
    message: "Agreement approved and email sent to student.",
  })
}
