"use client"

import type { FormData } from "./FormWizard"

interface Props {
  formData: FormData
  submissionId: string
  onNewSubmission: () => void
}

export default function SuccessScreen({ formData, submissionId, onNewSubmission }: Props) {
  return (
    <div className="form-card">
      <div className="success-screen">
        <div className="success-icon" style={{ fontSize: "2rem", lineHeight: 1 }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--primary)" }}>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.81a16 16 0 0 0 6 6l.9-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.73 16z" />
            <polyline points="16 2 20 6 12 14" />
          </svg>
        </div>
        <h2>Agreement Submitted!</h2>
        <p>
          Your agreement has been received. The admin will review it and send you a confirmation
          email to <strong>{formData.email}</strong> once approved.
        </p>

        <div className="success-details">
          <h3>Submission Summary</h3>
          <div className="success-detail-row">
            <span className="detail-label">Name</span>
            <span className="detail-value">{formData.fullName}</span>
          </div>
          <div className="success-detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">{formData.email}</span>
          </div>
          {formData.dateOfBirth && (
            <div className="success-detail-row">
              <span className="detail-label">Date of Birth</span>
              <span className="detail-value">{formData.dateOfBirth}</span>
            </div>
          )}
          {formData.parentsName && (
            <div className="success-detail-row">
              <span className="detail-label">Parent's Name</span>
              <span className="detail-value">{formData.parentsName}</span>
            </div>
          )}
          <div className="success-detail-row">
            <span className="detail-label">Submission ID</span>
            <span
              className="detail-value"
              style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              {submissionId}
            </span>
          </div>
          <div className="success-detail-row">
            <span className="detail-label">Status</span>
            <span className="detail-value" style={{ color: "#d97706", fontWeight: 600 }}>
              Pending Admin Review
            </span>
          </div>
        </div>

        <div className="success-actions">
          <button className="btn btn-secondary" onClick={onNewSubmission}>
            New Submission
          </button>
        </div>
      </div>
    </div>
  )
}
