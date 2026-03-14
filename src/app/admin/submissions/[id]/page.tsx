"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import SignatureCapture from "@/components/SignatureCapture"
import { agreementConfig } from "@/config/agreement"

interface Submission {
  id: string
  status: "pending" | "approved"
  formData: Record<string, string>
  signatureDataUrl: string
  parentSignatureDataUrl?: string | null
  adminData: {
    adminName: string
    notes: string
    title?: string
    catalogDate?: string
  } | null
  adminSignatureDataUrl: string | null
  submittedAt: string
  approvedAt: string | null
}

function InfoField({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="admin-info-field">
      <span className="admin-info-label">{label}</span>
      <span className="admin-info-value">{value}</span>
    </div>
  )
}

export default function SubmissionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [adminName, setAdminName] = useState("")
  const [notes, setNotes] = useState("")
  const [adminTitle, setAdminTitle] = useState("")
  const [catalogDate, setCatalogDate] = useState("")
  const [adminSignature, setAdminSignature] = useState("")
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [approved, setApproved] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/submissions/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else {
          setSubmission(data.submission)
          if (data.submission.adminData) {
            const ad = data.submission.adminData
            setAdminName(ad.adminName || "")
            setNotes(ad.notes || "")
            setAdminTitle(ad.title || "")
            setCatalogDate(ad.catalogDate || "")
          }
        }
      })
      .catch(() => setError("Failed to load submission"))
      .finally(() => setLoading(false))
  }, [id])

  const handleSignatureCapture = useCallback((dataUrl: string) => {
    setAdminSignature(dataUrl)
  }, [])

  const handleApprove = async () => {
    if (!adminName.trim()) {
      setFormError("Admin name is required")
      return
    }
    if (!adminSignature) {
      setFormError("Please provide your signature")
      return
    }
    setFormError("")
    setSubmitting(true)
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminData: {
            adminName: adminName.trim(),
            notes: notes.trim(),
            title: adminTitle.trim() || undefined,
            catalogDate: catalogDate.trim() || undefined,
          },
          adminSignatureDataUrl: adminSignature,
        }),
      })
      const data = await res.json()
      if (!res.ok) setFormError(data.error || "Approval failed")
      else {
        setApproved(true)
        setSubmission(data.submission)
      }
    } catch {
      setFormError("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: "80px" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-muted)" }}>Loading submission...</p>
      </div>
    )
  }

  if (error || !submission) {
    return (
      <div style={{ textAlign: "center", paddingTop: "80px" }}>
        <p style={{ color: "var(--error-color)", marginBottom: "16px" }}>
          {error || "Submission not found"}
        </p>
        <button className="btn btn-secondary" onClick={() => router.push("/admin")}>
          Back to Dashboard
        </button>
      </div>
    )
  }

  const { formData } = submission
  const isAlreadyApproved = submission.status === "approved"

  if (approved) {
    return (
      <div style={{ maxWidth: "540px", margin: "60px auto 0" }}>
        <div className="form-card">
          <div className="success-screen">
            <div className="success-icon">
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--success-color)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Agreement Approved</h2>
            <p>
              The signed agreement has been emailed to <strong>{submission.formData.email}</strong>.
            </p>
            <div className="success-actions">
              <button className="btn btn-primary" onClick={() => router.push("/admin")}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="admin-breadcrumb">
        <button
          className="btn btn-secondary"
          style={{ padding: "6px 16px", fontSize: "0.83rem" }}
          onClick={() => router.push("/admin")}>
          ← Dashboard
        </button>
        <span className="admin-breadcrumb-id">#{id.slice(0, 8)}</span>
        <span
          className={`admin-badge admin-badge--${submission.status}`}
          style={{ marginLeft: "auto" }}>
          {isAlreadyApproved ? "Approved" : "Pending Review"}
        </span>
      </div>

      {/* ── 1. Student Info ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>Student Information</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Submitted{" "}
            {new Date(submission.submittedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
          </span>
        </div>
        <div className="admin-card-body">
          <div className="admin-info-grid">
            <InfoField label="Full Name" value={formData.fullName} />
            <InfoField label="Email" value={formData.email} />
            <InfoField label="Phone" value={formData.phone} />
            <InfoField label="Date of Birth" value={formData.dateOfBirth} />
            <InfoField label="Parent's Name" value={formData.parentsName} />
            <InfoField label="Student ID" value={formData.studentId} />
            <InfoField label="Date" value={formData.date} />
          </div>

          <div style={{ marginTop: "24px" }}>
            <div className="admin-info-label" style={{ marginBottom: "10px" }}>
              Student Signature
            </div>
            <div className="admin-sig-box">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={submission.signatureDataUrl}
                alt="Student signature"
                style={{ height: "60px", display: "block" }}
              />
            </div>
          </div>

          {submission.parentSignatureDataUrl && (
            <div style={{ marginTop: "24px" }}>
              <div className="admin-info-label" style={{ marginBottom: "10px" }}>
                Parent/Guardian Signature
              </div>
              <div className="admin-sig-box">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={submission.parentSignatureDataUrl}
                  alt="Parent/guardian signature"
                  style={{ height: "60px", display: "block" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Agreement Text ── */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>{agreementConfig.title}</h2>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Last updated: {agreementConfig.lastUpdated}
          </span>
        </div>
        <div className="admin-card-body">
          <div className="admin-agreement-box">
            {(agreementConfig.sections as Array<{ heading: string; content: string }>).map(
              (section, i) => (
                <div className="admin-agreement-section" key={i}>
                  <h3>{section.heading}</h3>
                  <p style={{ whiteSpace: "pre-line" }}>{section.content}</p>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Admin Approval or read-only ── */}
      {isAlreadyApproved ? (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Approval Details</h2>
            {submission.approvedAt && (
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                Approved{" "}
                {new Date(submission.approvedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
              </span>
            )}
          </div>
          <div className="admin-card-body">
            <div className="admin-info-grid">
              <InfoField label="Approved By" value={submission.adminData?.adminName} />
              {submission.adminData?.notes && (
                <InfoField label="Notes" value={submission.adminData.notes} />
              )}
            </div>
            {submission.adminSignatureDataUrl && (
              <div style={{ marginTop: "24px" }}>
                <div className="admin-info-label" style={{ marginBottom: "10px" }}>
                  Admin Signature
                </div>
                <div className="admin-sig-box">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={submission.adminSignatureDataUrl}
                    alt="Admin signature"
                    style={{ height: "60px", display: "block" }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>Admin Approval</h2>
          </div>
          <div className="admin-card-body">
            <p
              style={{
                margin: "0 0 28px",
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                lineHeight: 1.6,
              }}>
              Fill in your details and sign below. Clicking{" "}
              <strong>Approve &amp; Send Email</strong> will generate the final PDF with both
              signatures and email it to the student.
            </p>

            <div className="admin-info-grid" style={{ marginBottom: "24px" }}>
              <div className="form-group">
                <label htmlFor="adminName">
                  Your Name <span className="required">*</span>
                </label>
                <input
                  id="adminName"
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  placeholder="Full name of approver"
                  className={formError && !adminName.trim() ? "error" : ""}
                />
              </div>
              <div className="form-group">
                <label htmlFor="adminTitle">
                  Title{" "}
                  <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(e.g. CSR)</span>
                </label>
                <input
                  id="adminTitle"
                  type="text"
                  value={adminTitle}
                  onChange={e => setAdminTitle(e.target.value)}
                  placeholder="APCC Representative title"
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">
                  Notes{" "}
                  <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <input
                  id="notes"
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any remarks..."
                />
              </div>
              <div className="form-group">
                <label htmlFor="catalogDate">
                  Catalog Date{" "}
                  <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
                    (optional — fill or edit later)
                  </span>
                </label>
                <input
                  id="catalogDate"
                  type="text"
                  value={catalogDate}
                  onChange={e => setCatalogDate(e.target.value)}
                  placeholder="Leave empty if needed later"
                />
              </div>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 500,
                  marginBottom: "12px",
                  fontSize: "0.9rem",
                  color: "var(--text-secondary)",
                }}>
                Your Signature <span className="required">*</span>
              </label>
              <SignatureCapture onCapture={handleSignatureCapture} />
            </div>

            {formError && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px 16px",
                  background: "var(--error-bg)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--error-color)",
                  fontSize: "0.88rem",
                }}>
                {formError}
              </div>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "28px",
                paddingTop: "20px",
                borderTop: "1px solid var(--border-light)",
              }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApprove}
                disabled={submitting}
                style={{ minWidth: "220px" }}>
                {submitting ? "Sending..." : "Approve & Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <div className="submit-overlay">
          <div className="spinner" />
          <p>Generating PDF and sending email...</p>
        </div>
      )}
    </>
  )
}
