"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface SubmissionSummary {
  id: string
  status: "pending" | "approved"
  fullName: string
  email: string
  studentId: string
  submittedAt: string
  deletedAt?: string | null
}

interface ConfirmModalState {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
}

function AdminDashboardContent() {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved">("all")
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams ? searchParams.get("view") : null
  const currentTab = view === "trash" ? "trash" : "active"

  useEffect(() => {
    setLoading(true)
    setError("")
    const url = currentTab === "trash" ? "/api/admin/submissions?trash=true" : "/api/admin/submissions"
    fetch(url)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setSubmissions(data.submissions || [])
      })
      .catch(() => setError("Failed to load submissions"))
      .finally(() => setLoading(false))
  }, [currentTab])

  const handleMoveToTrash = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id))
      } else {
        const d = await res.json()
        alert(d.error || "Failed to delete submission")
      }
    } catch {
      alert("Failed to delete submission")
    }
  }

  const triggerMoveToTrash = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Move to Trash",
      message: `Are you sure you want to move ${name}'s submission to the Trash?`,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        handleMoveToTrash(id)
      }
    })
  }

  const handleRestore = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/restore`, { method: "POST" })
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id))
      } else {
        const d = await res.json()
        alert(d.error || "Failed to restore submission")
      }
    } catch {
      alert("Failed to restore submission")
    }
  }

  const handlePermanentDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}?permanent=true`, { method: "DELETE" })
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id))
      } else {
        const d = await res.json()
        alert(d.error || "Failed to delete submission")
      }
    } catch {
      alert("Failed to delete submission")
    }
  }

  const triggerPermanentDelete = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Permanently",
      message: `WARNING: Are you sure you want to PERMANENTLY delete ${name}'s submission? This action cannot be undone.`,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        handlePermanentDelete(id)
      }
    })
  }

  const getDaysRemaining = (deletedAtStr?: string | null) => {
    if (!deletedAtStr) return ""
    const deletedAt = new Date(deletedAtStr)
    const expireDate = new Date(deletedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    const diffTime = expireDate.getTime() - Date.now()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? `${diffDays} days left` : "Expiring soon"
  }

  const pending = submissions.filter(s => s.status === "pending")
  const approved = submissions.filter(s => s.status === "approved")

  const filteredSubmissions = submissions.filter(s => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      s.fullName.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      s.studentId.toLowerCase().includes(searchLower)
    
    return matchesStatus && matchesSearch
  })

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

      <div className="admin-page-header">
        <div>
          <h1>Dashboard</h1>
          <p>{currentTab === "active" ? "Manage student agreement submissions" : "View soft-deleted submissions"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="admin-stats">
        {[
          { label: currentTab === "active" ? "Active Submissions" : "Trashed Submissions", count: submissions.length, color: "var(--accent-primary)" },
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
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <h2 style={{ margin: 0 }}>{currentTab === "active" ? "All Submissions" : "Trash Bin"}</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.9rem',
                minWidth: '250px'
              }}
            />
            {currentTab === "active" && (
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value as "all" | "pending" | "approved")}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  backgroundColor: 'white'
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
              </select>
            )}
          </div>
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
            {currentTab === "active" ? "No active submissions yet." : "Trash bin is empty."}
          </div>
        )}

        {!loading && !error && submissions.length > 0 && filteredSubmissions.length === 0 && (
          <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            No matching submissions found.
          </div>
        )}

        {!loading && filteredSubmissions.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>{currentTab === "active" ? "Submitted" : "Trashed"}</th>
                  <th>{currentTab === "active" ? "Status" : "Retention"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredSubmissions.map(s => (
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
                      {new Date(currentTab === "active" ? s.submittedAt : (s.deletedAt || s.submittedAt)).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td>
                      {currentTab === "active" ? (
                        <span className={`admin-badge admin-badge--${s.status}`}>
                          {s.status === "pending" ? "Pending" : "Approved"}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--error-color)", fontWeight: 600 }}>
                          {getDaysRemaining(s.deletedAt)}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingRight: "16px" }}>
                        {currentTab === "active" ? (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: "6px 18px", fontSize: "0.82rem" }}
                              onClick={() => router.push(`/admin/submissions/${s.id}`)}>
                              {s.status === "pending" ? "Review" : "View"}
                            </button>
                            <div style={{ position: "relative", display: "inline-block" }}>
                              <button
                                className="btn btn-secondary"
                                style={{ 
                                  padding: "6px 10px", 
                                  fontSize: "0.82rem", 
                                  color: "var(--text-secondary)",
                                  background: "transparent",
                                  border: "1px solid var(--border-light)",
                                  cursor: "pointer",
                                  lineHeight: 1
                                }}
                                onClick={() => setOpenMenuId(openMenuId === s.id ? null : s.id)}>
                                •••
                              </button>
                              {openMenuId === s.id && (
                                <>
                                  <div 
                                    style={{ position: "fixed", inset: 0, zIndex: 9 }} 
                                    onClick={() => setOpenMenuId(null)} 
                                  />
                                  <div style={{
                                    position: "absolute",
                                    right: 0,
                                    top: "100%",
                                    marginTop: "4px",
                                    background: "white",
                                    border: "1px solid var(--border-light)",
                                    borderRadius: "6px",
                                    boxShadow: "var(--shadow-md)",
                                    zIndex: 10,
                                    minWidth: "120px",
                                    overflow: "hidden"
                                  }}>
                                    <button
                                      style={{
                                        width: "100%",
                                        textAlign: "left",
                                        padding: "10px 14px",
                                        background: "none",
                                        border: "none",
                                        color: "var(--error-color)",
                                        fontSize: "0.82rem",
                                        cursor: "pointer",
                                        fontWeight: 500,
                                      }}
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        triggerMoveToTrash(s.id, s.fullName);
                                      }}>
                                      Move to Trash
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ 
                                padding: "6px 14px", 
                                fontSize: "0.82rem",
                                background: "var(--success-color)",
                                borderColor: "var(--success-color)",
                              }}
                              onClick={() => handleRestore(s.id)}>
                              Restore
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ 
                                padding: "6px 14px", 
                                fontSize: "0.82rem", 
                                color: "var(--error-color)",
                                borderColor: "var(--error-color)",
                                background: "transparent"
                              }}
                              onClick={() => triggerPermanentDelete(s.id, s.fullName)}>
                              Delete
                            </button>
                          </>
                        )}
                      </div>
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

export default function AdminDashboard() {
  return (
    <Suspense fallback={
      <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--text-muted)" }}>
        <div className="spinner" style={{ margin: "0 auto 16px" }} />
        Loading Dashboard...
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  )
}
