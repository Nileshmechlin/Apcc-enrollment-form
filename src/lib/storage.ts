import { pool } from "./db"

export interface AdminData {
  adminName: string
  notes: string
  /** APCC Representative title (e.g. CSR). */
  title?: string
  /** Catalog date; can be left empty for CSR to fill or edit later. */
  catalogDate?: string
  /** Section 7 — filled by CSR (same alignment as PDF). */
  startDate?: string
  startingProgram?: string
  tuition?: string
}

export interface Submission {
  id: string
  status: "pending" | "approved"
  formData: Record<string, string>
  signatureDataUrl: string
  /** Present when the student is a minor; omitted on older submissions. */
  parentSignatureDataUrl?: string | null
  adminData: AdminData | null
  adminSignatureDataUrl: string | null
  submittedAt: string
  approvedAt: string | null
}

// ---------------------------------------------------------------------------
// Row → Submission mapper
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSubmission(row: Record<string, any>): Submission {
  return {
    id: row.id,
    status: row.status as "pending" | "approved",
    formData: row.form_data,
    signatureDataUrl: row.signature_data_url,
    parentSignatureDataUrl: row.parent_signature_data_url ?? null,
    adminData: row.admin_data ?? null,
    adminSignatureDataUrl: row.admin_signature_data_url ?? null,
    submittedAt: row.submitted_at instanceof Date
      ? row.submitted_at.toISOString()
      : String(row.submitted_at),
    approvedAt: row.approved_at
      ? row.approved_at instanceof Date
        ? row.approved_at.toISOString()
        : String(row.approved_at)
      : null,
  }
}

// ---------------------------------------------------------------------------
// Public API (all async — PostgreSQL backed)
// ---------------------------------------------------------------------------

export async function readSubmissions(): Promise<Submission[]> {
  const result = await pool.query(
    "SELECT * FROM submissions ORDER BY submitted_at DESC",
  )
  return result.rows.map(rowToSubmission)
}

export async function saveSubmission(
  formData: Record<string, string>,
  signatureDataUrl: string,
  parentSignatureDataUrl?: string | null,
): Promise<Submission> {
  const result = await pool.query(
    `INSERT INTO submissions
       (form_data, signature_data_url, parent_signature_data_url)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [
      JSON.stringify(formData),
      signatureDataUrl,
      parentSignatureDataUrl ?? null,
    ],
  )
  return rowToSubmission(result.rows[0])
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  const result = await pool.query(
    "SELECT * FROM submissions WHERE id = $1",
    [id],
  )
  if (result.rows.length === 0) return null
  return rowToSubmission(result.rows[0])
}

export async function updateSubmission(
  id: string,
  updates: Partial<Submission>,
): Promise<Submission | null> {
  // Build SET clause dynamically from allowed fields
  const setClauses: string[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const values: any[] = []
  let paramIndex = 1

  if (updates.status !== undefined) {
    setClauses.push(`status = $${paramIndex++}`)
    values.push(updates.status)
  }
  if (updates.formData !== undefined) {
    setClauses.push(`form_data = $${paramIndex++}`)
    values.push(JSON.stringify(updates.formData))
  }
  if (updates.signatureDataUrl !== undefined) {
    setClauses.push(`signature_data_url = $${paramIndex++}`)
    values.push(updates.signatureDataUrl)
  }
  if ("parentSignatureDataUrl" in updates) {
    setClauses.push(`parent_signature_data_url = $${paramIndex++}`)
    values.push(updates.parentSignatureDataUrl ?? null)
  }
  if ("adminData" in updates) {
    setClauses.push(`admin_data = $${paramIndex++}`)
    values.push(updates.adminData ? JSON.stringify(updates.adminData) : null)
  }
  if ("adminSignatureDataUrl" in updates) {
    setClauses.push(`admin_signature_data_url = $${paramIndex++}`)
    values.push(updates.adminSignatureDataUrl ?? null)
  }
  if ("approvedAt" in updates) {
    setClauses.push(`approved_at = $${paramIndex++}`)
    values.push(updates.approvedAt ?? null)
  }

  if (setClauses.length === 0) {
    // Nothing to update — just return the current record
    return getSubmissionById(id)
  }

  values.push(id)
  const result = await pool.query(
    `UPDATE submissions SET ${setClauses.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  )

  if (result.rows.length === 0) return null
  return rowToSubmission(result.rows[0])
}
