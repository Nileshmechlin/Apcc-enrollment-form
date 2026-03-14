import fs from "fs"
import path from "path"

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

// Store submissions in /data/submissions.json at project root
const DATA_DIR = path.join(process.cwd(), "data")
const DATA_FILE = path.join(DATA_DIR, "submissions.json")

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), "utf-8")
  }
}

export function readSubmissions(): Submission[] {
  ensureFile()
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8")
    return JSON.parse(raw) as Submission[]
  } catch {
    return []
  }
}

function writeSubmissions(submissions: Submission[]): void {
  ensureFile()
  fs.writeFileSync(DATA_FILE, JSON.stringify(submissions, null, 2), "utf-8")
}

/** Simple UUID v4 without external dependencies */
function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export function saveSubmission(
  formData: Record<string, string>,
  signatureDataUrl: string,
  parentSignatureDataUrl?: string | null,
): Submission {
  const submissions = readSubmissions()
  const submission: Submission = {
    id: generateId(),
    status: "pending",
    formData,
    signatureDataUrl,
    parentSignatureDataUrl: parentSignatureDataUrl ?? null,
    adminData: null,
    adminSignatureDataUrl: null,
    submittedAt: new Date().toISOString(),
    approvedAt: null,
  }
  submissions.unshift(submission)
  writeSubmissions(submissions)
  return submission
}

export function getSubmissionById(id: string): Submission | null {
  const submissions = readSubmissions()
  return submissions.find(s => s.id === id) ?? null
}

export function updateSubmission(id: string, updates: Partial<Submission>): Submission | null {
  const submissions = readSubmissions()
  const index = submissions.findIndex(s => s.id === id)
  if (index === -1) return null
  submissions[index] = { ...submissions[index], ...updates }
  writeSubmissions(submissions)
  return submissions[index]
}
