"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"

function NavActions() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
  }

  const view = searchParams ? searchParams.get("view") : null
  const isTrashActive = pathname === "/admin" && view === "trash"
  const isDashboardActive = pathname === "/admin" && !isTrashActive

  return (
    <div className="admin-topnav-actions">
      <button
        className={isDashboardActive ? "btn btn-secondary" : "btn btn-ghost"}
        style={{ padding: "7px 18px", fontSize: "0.85rem" }}
        onClick={() => router.push("/admin")}>
        Dashboard
      </button>
      <button
        className={isTrashActive ? "btn btn-secondary" : "btn btn-ghost"}
        style={{ 
          padding: "7px 18px", 
          fontSize: "0.85rem", 
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
        onClick={() => router.push("/admin?view=trash")}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        Trash Bin
      </button>
      <button
        className="btn btn-ghost"
        style={{ padding: "7px 18px", fontSize: "0.85rem" }}
        onClick={handleLogout}>
        Sign Out
      </button>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin/login"

  // Login page uses the student-style centered layout
  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <>
      <nav className="admin-topnav">
        <div className="admin-topnav-inner">
          <div className="admin-topnav-brand">
            <span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            Admin Portal
          </div>
          <Suspense fallback={
            <div className="admin-topnav-actions">
              <button className="btn btn-ghost" style={{ padding: "7px 18px", fontSize: "0.85rem" }}>
                Loading...
              </button>
            </div>
          }>
            <NavActions />
          </Suspense>
        </div>
      </nav>
      <div className="admin-page">
        <div className="admin-page-inner">{children}</div>
      </div>
    </>
  )
}
