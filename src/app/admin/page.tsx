"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface SubmissionSummary {
  id: string
  status: "pending" | "approved"
  fullName: string
  email: string
  studentId: string
  submittedAt: string
}

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetch("/api/admin/submissions")
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setSubmissions(data.submissions || [])
      })
      .catch(() => setError("Failed to load submissions"))
      .finally(() => setLoading(false))
  }, [])

  const pending = submissions.filter(s => s.status === "pending")
  const approved = submissions.filter(s => s.status === "approved")

  return (
    <>
      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Manage student agreement submissions</p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {[
          { label: "Total Submissions", count: submissions.length, color: "var(--accent-primary)" },
          { label: "Pending Review", count: pending.length, color: "#d97706" },
          { label: "Approved", count: approved.length, color: "#059669" },
        ].map(({ label, count, color }) => (
          <div className="admin-stat-card" key={label}>
            <div className="admin-stat-number" style={{ color }}>
              {count}
            </div>
            <div className="admin-stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2>All Submissions</h2>
        </div>

        {loading && (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            <div className="spinner" style={{ margin: "0 auto 16px" }} />
            Loading...
          </div>
        )}

        {error && (
          <div style={{ padding: "24px", color: "var(--error-color)", textAlign: "center" }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && submissions.length === 0 && (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            No submissions yet.
          </div>
        )}

        {!loading && submissions.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                        }}>
                        {s.fullName}
                      </div>
                      <div
                        style={{
                          fontSize: "0.76rem",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                          fontFamily: "monospace",
                        }}>
                        {s.studentId}
                      </div>
                    </td>
                    <td style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
                      {s.email}
                    </td>
                    <td
                      style={{
                        fontSize: "0.83rem",
                        color: "var(--text-muted)",
                        whiteSpace: "nowrap",
                      }}>
                      {new Date(s.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      <span className={`admin-badge admin-badge--${s.status}`}>
                        {s.status === "pending" ? "Pending" : "Approved"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "6px 18px", fontSize: "0.82rem" }}
                        onClick={() => router.push(`/admin/submissions/${s.id}`)}>
                        {s.status === "pending" ? "Review" : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
