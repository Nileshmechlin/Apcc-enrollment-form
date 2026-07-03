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
    startDate?: string
    endDate?: string
    selectedProgram?: string
    tuition?: string
    registrationFee?: string
    classHours?: string
    externHours?: string
    paymentsStartingDate?: string
    totalTuition?: string
  } | null
  adminSignatureDataUrl: string | null
  submittedAt: string
  approvedAt: string | null
  deletedAt: string | null
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

interface ConfirmModalState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
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
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("")
  const [tuition, setTuition] = useState("")
  const [registrationFee, setRegistrationFee] = useState("50")
  const [classHours, setClassHours] = useState("")
  const [externHours, setExternHours] = useState("")
  const [paymentsStartingDate, setPaymentsStartingDate] = useState("")
  const [totalTuition, setTotalTuition] = useState("")
  
  const [adminSignature, setAdminSignature] = useState("")
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [approved, setApproved] = useState(false)

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })

  const handleMoveToTrash = async () => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to move submission to trash");
      }
    } catch {
      alert("Failed to move submission to trash");
    }
  }

  const triggerMoveToTrash = () => {
    setConfirmModal({
      isOpen: true,
      title: "Move to Trash",
      message: "Are you sure you want to move this submission to the Trash?",
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        handleMoveToTrash()
      }
    })
  }

  const handlePermanentDelete = async () => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}?permanent=true`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete submission");
      }
    } catch {
      alert("Failed to delete submission");
    }
  }

  const triggerPermanentDelete = () => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Permanently",
      message: "Are you sure you want to PERMANENTLY delete this submission? This action cannot be undone.",
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        handlePermanentDelete()
      }
    })
  }

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
            setStartDate(ad.startDate || "")
            setEndDate(ad.endDate || "")
            setSelectedProgram(ad.selectedProgram || "")
            setTuition(ad.tuition || "")
            setRegistrationFee(ad.registrationFee || "50")
            setClassHours(ad.classHours || "")
            setExternHours(ad.externHours || "")
            setPaymentsStartingDate(ad.paymentsStartingDate || "")
            setTotalTuition(ad.totalTuition || "")
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
            startDate: startDate.trim() || undefined,
            endDate: endDate.trim() || undefined,
            selectedProgram: selectedProgram.trim() || undefined,
            tuition: tuition.trim() || undefined,
            registrationFee: registrationFee.trim() || undefined,
            classHours: classHours.trim() || undefined,
            externHours: externHours.trim() || undefined,
            paymentsStartingDate: paymentsStartingDate.trim() || undefined,
            totalTuition: totalTuition.trim() || undefined,
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

  const isDeleted = !!submission.deletedAt

  return (
    <>
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          animation: "modalFadeIn 0.2s ease"
        }}>
          <div style={{
            background: "white",
            padding: "32px",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
            width: "100%",
            maxWidth: "440px",
            textAlign: "center",
            border: "1px solid var(--border-light)",
            animation: "modalScaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              background: confirmModal.title.includes("Permanent") ? "var(--error-bg)" : "var(--accent-light)",
              color: confirmModal.title.includes("Permanent") ? "var(--error-color)" : "var(--accent-primary)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "1.25rem"
            }}>
              {confirmModal.title.includes("Permanent") ? "⚠️" : "🗑️"}
            </div>
            <h3 style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "12px"
            }}>
              {confirmModal.title}
            </h3>
            <p style={{
              fontSize: "0.9rem",
              color: "var(--text-secondary)",
              lineHeight: 1.5,
              marginBottom: "28px"
            }}>
              {confirmModal.message}
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center"
            }}>
              <button
                className="btn btn-secondary"
                style={{ 
                  flex: 1, 
                  padding: "10px 16px", 
                  fontSize: "0.88rem",
                  background: "transparent",
                  borderColor: "var(--border-light)",
                  color: "var(--text-secondary)"
                }}
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                style={{ 
                  flex: 1, 
                  padding: "10px 16px", 
                  fontSize: "0.88rem",
                  background: confirmModal.title.includes("Permanent") ? "var(--error-color)" : "var(--accent-primary)",
                  borderColor: confirmModal.title.includes("Permanent") ? "var(--error-color)" : "var(--accent-primary)"
                }}
                onClick={confirmModal.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trashed Warning Banner */}
      {isDeleted && (
        <div style={{
          background: "var(--error-bg)",
          border: "1px solid var(--error-color)",
          color: "var(--error-color)",
          padding: "16px 20px",
          borderRadius: "var(--radius-lg)",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px"
        }}>
          <div>
            <h3 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>⚠️ In Trash Bin</h3>
            <p style={{ margin: 0, fontSize: "0.85rem", opacity: 0.9 }}>
              This submission is soft-deleted. It will be permanently removed automatically within 30 days.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button 
              className="btn btn-primary"
              style={{ padding: "8px 16px", fontSize: "0.83rem", background: "var(--success-color)", borderColor: "var(--success-color)" }}
              onClick={async () => {
                try {
                  const res = await fetch(`/api/admin/submissions/${id}/restore`, { method: "POST" });
                  if (res.ok) {
                    const data = await res.json();
                    setSubmission(data.submission);
                  } else {
                    const data = await res.json();
                    alert(data.error || "Failed to restore submission");
                  }
                } catch {
                  alert("Failed to restore submission");
                }
              }}
            >
              Restore
            </button>
            <button 
              className="btn btn-secondary"
              style={{ padding: "8px 16px", fontSize: "0.83rem", color: "var(--error-color)", borderColor: "var(--error-color)", background: "transparent" }}
              onClick={triggerPermanentDelete}
            >
              Delete Permanently
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="admin-breadcrumb" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          className="btn btn-secondary"
          style={{ padding: "6px 16px", fontSize: "0.83rem" }}
          onClick={() => router.push("/admin")}>
          ← Dashboard
        </button>
        <span className="admin-breadcrumb-id">#{id.slice(0, 8)}</span>
        
        {isDeleted ? (
          <span className="admin-badge" style={{ backgroundColor: "#94a3b8", color: "white", marginLeft: "auto" }}>
            Trashed
          </span>
        ) : (
          <span
            className={`admin-badge admin-badge--${submission.status}`}
            style={{ marginLeft: "auto" }}>
            {isAlreadyApproved ? "Approved" : "Pending Review"}
          </span>
        )}

        {!isDeleted && (
          <button
            className="btn btn-secondary"
            style={{ 
              padding: "6px 16px", 
              fontSize: "0.83rem", 
              color: "var(--error-color)", 
              borderColor: "var(--error-color)", 
              background: "transparent",
              marginLeft: "8px"
            }}
            onClick={triggerMoveToTrash}
          >
            Move to Trash
          </button>
        )}
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
            <InfoField label="Address" value={formData.address} />
            <InfoField label="Emergency Contact" value={`${formData.emergencyName} (${formData.emergencyRelationship}) - ${formData.emergencyPhone}`} />
            <InfoField label="Medical Conditions" value={formData.medicalConditions} />
            <InfoField label="HS Diploma" value={formData.highSchoolDiploma} />
            <InfoField label="1st Parent" value={formData.parent1Name} />
            <InfoField label="2nd Parent" value={formData.parent2Name} />
            <InfoField label="Student ID" value={formData.studentId} />
            <InfoField label="Initials" value={formData.initials} />
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
            {(agreementConfig.pages as Array<{ number: number; content: string }>).map(
              (page, i) => {
                let resolvedContent = page.content;
                Object.entries(submission.formData).forEach(([key, value]) => {
                  const regex = new RegExp(`\\[${key}\\]`, 'gi');
                  resolvedContent = resolvedContent.replace(regex, value || `[${key}]`);
                });

                return (
                  <div className="admin-agreement-section" key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
                      <h3 style={{ margin: 0 }}>Page {page.number}</h3>
                      <span style={{ fontSize: "0.75rem", color: "#999", fontStyle: "italic" }}>Accelerated Pathways Career College</span>
                    </div>
                    {page.number === 1 && (
                      <div style={{ textAlign: "center", marginBottom: "16px" }}>
                        <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: "0 0 4px" }}>Accelerated Pathways Career College (APCC)</h2>
                        <h3 style={{ fontSize: "0.9rem", fontWeight: 700, margin: 0 }}>Enrollment Agreement</h3>
                      </div>
                    )}
                    <p style={{ whiteSpace: "pre-line" }}>{resolvedContent}</p>
                  </div>
                );
              },
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Admin Approval / Edit & download ── */}
      {isAlreadyApproved && (
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
              <InfoField label="Start Date" value={submission.adminData?.startDate} />
              <InfoField label="End Date" value={submission.adminData?.endDate} />
              <InfoField label="Selected Program" value={submission.adminData?.selectedProgram} />
              <InfoField label="Tuition Cost" value={submission.adminData?.tuition} />
              <InfoField label="Reg. Fee" value={submission.adminData?.registrationFee} />
              <InfoField label="Class Hours" value={submission.adminData?.classHours} />
              <InfoField label="Extern Hours" value={submission.adminData?.externHours} />
              <InfoField label="Payments Start" value={submission.adminData?.paymentsStartingDate} />
              <InfoField label="Total Tuition Cost" value={submission.adminData?.totalTuition} />
              {submission.adminData?.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <InfoField label="Notes" value={submission.adminData.notes} />
                </div>
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
      )}

      {/* Admin Approval form */}
      {!isDeleted && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h2>{isAlreadyApproved ? "Edit Admin Details" : "Admin Approval"}</h2>
          </div>
          <div className="admin-card-body">
            <p style={{ margin: "0 0 24px", fontSize: "0.88rem", color: "var(--text-muted)" }}>
              {isAlreadyApproved 
                ? "Update the agreement details below. Saving will update the records and open the revised PDF."
                : "Fill in the enrollment details and sign below to approve the agreement and notify the student."}
            </p>

            <div className="admin-info-grid" style={{ marginBottom: "24px" }}>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Selected Program</label>
                <input type="text" value={selectedProgram} onChange={e => setSelectedProgram(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Tuition Cost</label>
                <input type="text" value={tuition} onChange={e => setTuition(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Reg. Fee</label>
                <input type="text" value={registrationFee} onChange={e => setRegistrationFee(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Class Hours</label>
                <input type="text" value={classHours} onChange={e => setClassHours(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Extern Hours</label>
                <input type="text" value={externHours} onChange={e => setExternHours(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Payments Start Date</label>
                <input type="date" value={paymentsStartingDate} onChange={e => setPaymentsStartingDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Total Tuition Cost</label>
                <input type="text" value={totalTuition} onChange={e => setTotalTuition(e.target.value)} />
              </div>
            </div>

            <div className="admin-info-grid" style={{ marginBottom: "24px" }}>
              <div className="form-group">
                <label>Your Name <span className="required">*</span></label>
                <input type="text" value={adminName} onChange={e => setAdminName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Title (e.g. CSR)</label>
                <input type="text" value={adminTitle} onChange={e => setAdminTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Catalog Date</label>
                <input type="text" value={catalogDate} onChange={e => setCatalogDate(e.target.value)} />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} />
            </div>

            {!isAlreadyApproved && (
              <div style={{ marginTop: "24px" }}>
                <label style={{ display: "block", marginBottom: "12px", fontWeight: 500 }}>Your Signature <span className="required">*</span></label>
                <SignatureCapture onCapture={handleSignatureCapture} />
              </div>
            )}

            {formError && <p className="error-message" style={{ marginTop: "16px" }}>{formError}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "32px" }}>
              {isAlreadyApproved ? (
                <button 
                  className="btn btn-primary" 
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const res = await fetch(`/api/admin/submissions/${id}/admin-data`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          adminData: {
                            adminName, notes, title: adminTitle, catalogDate, startDate, endDate, selectedProgram, tuition, registrationFee, classHours, externHours, paymentsStartingDate, totalTuition
                          }
                        })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setSubmission(data.submission);
                        window.open(`/api/admin/submissions/${id}/pdf`, "_blank");
                      }
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : "Save & View PDF"}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleApprove} disabled={submitting}>
                  {submitting ? "Approving..." : "Approve & Send Email"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {submitting && (
        <div className="submit-overlay">
          <div className="spinner" />
          <p>Processing agreement...</p>
        </div>
      )}
    </>
  )
}
