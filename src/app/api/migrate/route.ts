import { NextRequest, NextResponse } from "next/server"
import { runMigrations } from "@/lib/migrate"

// One-time setup endpoint: GET /api/migrate
// Requires the ADMIN_PASSWORD header for security
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const expectedPassword = process.env.ADMIN_PASSWORD || "Admin@123"

  // Simple bearer-token check
  if (authHeader !== `Bearer ${expectedPassword}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await runMigrations()
    return NextResponse.json({
      success: true,
      message: "Database schema is up to date.",
    })
  } catch (error) {
    console.error("[Migrate] Error:", error)
    return NextResponse.json(
      {
        error: "Migration failed",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
