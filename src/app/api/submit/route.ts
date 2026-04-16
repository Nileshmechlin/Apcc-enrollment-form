import { NextRequest, NextResponse } from "next/server"
import { saveSubmission } from "@/lib/storage"
import { sendSubmissionNotification } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formData, signatureDataUrl, parentSignatureDataUrl } = body

    // Validate required fields
    if (!formData || !signatureDataUrl) {
      return NextResponse.json({ error: "Missing form data or signature" }, { status: 400 })
    }

    if (!formData.fullName || !formData.email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Save submission as "pending" — no PDF, no email yet
    const submission = await saveSubmission(
      formData,
      signatureDataUrl,
      parentSignatureDataUrl ?? null,
    )

    // Send notification to admin (non-blocking if possible, but for reliability we await or use a try-catch)
    try {
      await sendSubmissionNotification({
        studentName: formData.fullName,
        studentEmail: formData.email,
        adminEmail: process.env.ADMIN_EMAIL || "enrollment@apccollege.org",
      })
    } catch (emailError) {
      // Log error but don't fail the submission
      console.error("[Submit] Notification Error:", emailError)
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: "Agreement submitted successfully. The admin will review and finalize it.",
    })
  } catch (error) {
    console.error("[Submit] Error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again." }, { status: 500 })
  }
}
