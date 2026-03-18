import { jsPDF } from "jspdf"
import { agreementConfig } from "@/config/agreement"
import type { AdminData } from "@/lib/storage"

interface PdfFormData {
  [key: string]: string
}

const BULLET_INDENT_MM = 6
const LETTERED_INDENT_MM = 6
const LINE_HEIGHT = 5
const SECTION_SPACING = 4

/** PDF theme color #A68045 (APCC brand) — RGB */
const THEME_RGB = { r: 166, g: 128, b: 69 }

type SectionLike = { heading: string; content: string; csrTableOnPdf?: boolean }

/**
 * Renders section content with alignment matching the original document:
 * - Lines starting with ➔ are indented (bullet list)
 * - Lines starting with a) b) c) d) are indented (lettered list)
 * Returns the new y position.
 */
function renderSectionContent(
  doc: jsPDF,
  content: string,
  margin: number,
  contentWidth: number,
  startY: number,
  pageHeight: number,
): number {
  let y = startY
  const lines = content.split("\n")

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === "") {
      y += 3
      continue
    }

    if (y > pageHeight - 25) {
      doc.addPage()
      y = margin
    }

    const isBullet = /^➔\s*/.test(trimmed)
    const isLettered = /^[a-d]\)\s/.test(trimmed)

    if (isBullet) {
      const text = trimmed.replace(/^➔\s*/, "")
      const wrapped = doc.splitTextToSize("➔ " + text, contentWidth - BULLET_INDENT_MM)
      for (const w of wrapped) {
        if (y > pageHeight - 25) {
          doc.addPage()
          y = margin
        }
        doc.text(w, margin + BULLET_INDENT_MM, y)
        y += LINE_HEIGHT
      }
    } else if (isLettered) {
      const wrapped = doc.splitTextToSize(trimmed, contentWidth - LETTERED_INDENT_MM)
      for (const w of wrapped) {
        if (y > pageHeight - 25) {
          doc.addPage()
          y = margin
        }
        doc.text(w, margin + LETTERED_INDENT_MM, y)
        y += LINE_HEIGHT
      }
    } else {
      const wrapped = doc.splitTextToSize(trimmed, contentWidth)
      for (const w of wrapped) {
        if (y > pageHeight - 25) {
          doc.addPage()
          y = margin
        }
        doc.text(w, margin, y)
        y += LINE_HEIGHT
      }
    }
    y += 1
  }

  return y
}

/**
 * Generates a signed PDF matching the Provisional Membership Enrollment Agreement layout.
 * CSR-only fields (item 7 table, APCC Representative) are included on the PDF for CSR to fill.
 */
export async function generatePDF(
  formData: PdfFormData,
  signatureDataUrl: string,
  adminData?: AdminData,
  adminSignatureDataUrl?: string,
  parentSignatureDataUrl?: string | null,
): Promise<Buffer> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const subtitle =
    (agreementConfig as { subtitle?: string }).subtitle || "Accelerated Pathways Career College"

  // === Header (format like agreement-nilesh-vijay.pdf) ===
  doc.setFont("helvetica", "bold")
  doc.setFontSize(13)
  doc.setTextColor(30, 30, 30)
  doc.text(`${subtitle} Enrollment Agreement`, margin, y)
  y += 7

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(70, 70, 70)
  const lastUpdated =
    agreementConfig.lastUpdated?.trim() ||
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
  doc.text(`Last Updated: ${lastUpdated}`, margin, y)
  y += 9

  // === Student Information ===
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text("Student Information", margin, y)
  y += 7

  const isMinorStudent = (() => {
    const dob = formData.dateOfBirth
    if (!dob?.trim()) return false
    const birth = new Date(dob)
    if (isNaN(birth.getTime())) return false
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age < 18
  })()

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)
  const infoRows: Array<[string, string]> = [
    ["Full Name:", formData.fullName || ""],
    ["Phone:", formData.phone || ""],
    ["Is Minor:", isMinorStudent ? "Yes" : "No"],
    ["Student ID:", formData.studentId || ""],
    ["Email:", formData.email || ""],
  ]
  if (isMinorStudent) infoRows.push(["Guardian Name:", formData.parentsName || ""])
  if (formData.date) infoRows.push(["Date:", formData.date || ""])

  const labelW = 30
  for (const [label, value] of infoRows) {
    if (!value?.trim()) continue
    if (y > pageHeight - 25) {
      doc.addPage()
      y = margin
    }
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(doc.splitTextToSize(value, contentWidth - labelW), margin + labelW, y)
    y += 6
  }

  y += 4
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text("Agreement Terms", margin, y)
  y += 8

  const sections = agreementConfig.sections as SectionLike[]

  // === Numbered sections 1–10 ===
  for (const section of sections) {
    if (y > pageHeight - 40) {
      doc.addPage()
      y = margin
    }

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30, 30, 30)
    doc.text(section.heading, margin, y)
    y += 6

    y = renderSectionContent(doc, section.content, margin, contentWidth, y, pageHeight)
    y += SECTION_SPACING

    // Section 7: CSR-only table — 3 cols (Start Date, Starting Program, Tuition) then full-width Notes with ruled lines; alignment for CSR to fill
    if (section.csrTableOnPdf) {
      if (y > pageHeight - 55) {
        doc.addPage()
        y = margin
      }
      const colCount = 3
      const colW = contentWidth / colCount
      const headerRowH = 7
      const dataRowH = 8
      const tableY = y

      // Row 1: Headers (Start Date | Starting Program | Tuition) — theme color, light grey background
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, tableY, contentWidth, headerRowH, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(30, 30, 30)
      doc.text("Start Date", margin + colW * 0 + colW / 2, tableY + 4, { align: "center" })
      doc.text("Starting Program", margin + colW * 1 + colW / 2, tableY + 4, { align: "center" })
      doc.text("Tuition", margin + colW * 2 + colW / 2, tableY + 4, { align: "center" })
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.2)
      doc.rect(margin, tableY, contentWidth, headerRowH)
      doc.line(margin + colW, tableY, margin + colW, tableY + headerRowH)
      doc.line(margin + colW * 2, tableY, margin + colW * 2, tableY + headerRowH)

      // Row 2: Data row — underlines for CSR to fill; if adminData has values, draw them at same alignment
      const dataY = tableY + headerRowH
      doc.line(margin, dataY, margin + contentWidth, dataY)
      doc.line(margin + colW, dataY, margin + colW, dataY + dataRowH)
      doc.line(margin + colW * 2, dataY, margin + colW * 2, dataY + dataRowH)
      doc.rect(margin, dataY, contentWidth, dataRowH)
      const lineY = dataY + dataRowH - 2
      doc.setDrawColor(0, 0, 0)
      doc.line(margin + 4, lineY, margin + colW - 4, lineY)
      doc.line(margin + colW + 4, lineY, margin + colW * 2 - 4, lineY)
      doc.line(margin + colW * 2 + 4, lineY, margin + contentWidth - 4, lineY)
      doc.setDrawColor(180, 180, 180)
      // CSR-filled values (same alignment as underlines)
      if (adminData) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        if (adminData.startDate)
          doc.text(adminData.startDate, margin + colW / 2, lineY - 1, { align: "center" })
        if (adminData.startingProgram)
          doc.text(adminData.startingProgram, margin + colW + (colW / 2), lineY - 1, {
            align: "center",
          })
        if (adminData.tuition)
          doc.text(adminData.tuition, margin + colW * 2 + (colW / 2), lineY - 1, {
            align: "center",
          })
      }

      // Notes header row (full width) — light grey background
      const notesHeaderY = dataY + dataRowH
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, notesHeaderY, contentWidth, 6, "F")
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(30, 30, 30)
      doc.text("Notes", margin + 3, notesHeaderY + 4)
      doc.setDrawColor(180, 180, 180)
      doc.rect(margin, notesHeaderY, contentWidth, 6)
      doc.line(margin, notesHeaderY, margin + contentWidth, notesHeaderY)

      // Notes body: 5 ruled lines; if adminData.notes, draw text on lines
      const notesBodyY = notesHeaderY + 6
      const ruleSpacing = 6
      const noteLines = adminData?.notes
        ? adminData.notes.split(/\r?\n/).slice(0, 5)
        : []
      for (let i = 0; i < 5; i++) {
        const ly = notesBodyY + 2 + i * ruleSpacing
        doc.setDrawColor(0, 0, 0)
        doc.line(margin + 2, ly, margin + contentWidth - 2, ly)
        doc.setDrawColor(180, 180, 180)
        if (noteLines[i]) {
          doc.setFont("helvetica", "normal")
          doc.setFontSize(9)
          doc.setTextColor(0, 0, 0)
          doc.text(noteLines[i], margin + 4, ly - 1, { maxWidth: contentWidth - 8 })
        }
      }
      doc.rect(margin, notesHeaderY, contentWidth, 6 + 2 + 5 * ruleSpacing)

      y = notesBodyY + 2 + 5 * ruleSpacing + 6
    }
  }

  // === Signature block (match original: Student Name, Legal Guardian, Signature Dated, then signatures) ===
  if (y > pageHeight - 70) {
    doc.addPage()
    y = margin
  }

  y += 4
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)
  doc.text("Student Name:", margin, y)
  doc.text(formData.fullName || "_________________________", margin + 45, y)
  y += 7

  doc.text("Legal Guardian's Name:", margin, y)
  doc.text(
    formData.parentsName
      ? formData.parentsName
      : "(required if the Student is a minor)",
    margin + 45,
    y,
  )
  y += 7

  doc.text("Signature Dated:", margin, y)
  doc.text(
    formData.date ||
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    margin + 45,
    y,
  )
  y += 10

  // Signatures in black (lines and labels)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(margin, y, margin + 70, y)
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text("Student's Signature", margin, y)
  y += 2

  try {
    doc.addImage(signatureDataUrl, "PNG", margin, y, 70, 26)
  } catch {
    doc.text("[Signature]", margin, y + 10)
  }
  y += 32

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(margin, y, margin + 70, y)
  y += 5
  doc.text("Legal Guardian's Signature (if applicable)", margin, y)
  y += 2

  if (parentSignatureDataUrl) {
    try {
      doc.addImage(parentSignatureDataUrl, "PNG", margin, y, 70, 26)
    } catch {
      doc.text("[Signature]", margin, y + 10)
    }
    y += 30
  }

  y += 8

  // === APCC REPRESENTATIVE (CSR-only); theme for heading, signatures in black ===
  if (adminData && adminSignatureDataUrl) {
    if (y > pageHeight - 60) {
      doc.addPage()
      y = margin
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text("APCC REPRESENTATIVE", margin, y)
    y += 8

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.text("Name:", margin, y)
    doc.text(adminData.adminName || "", margin + 22, y)
    y += 6

    doc.text("Title:", margin, y)
    doc.text(adminData.title || "", margin + 22, y)
    y += 8

    doc.text("Signature Date:", margin, y)
    doc.text("Catalog Date:", margin + contentWidth / 2, y)
    const sigDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
    doc.text(sigDate, margin + 28, y)
    doc.text(adminData.catalogDate || "", margin + contentWidth / 2 + 28, y)
    y += 8

    doc.setDrawColor(0, 0, 0)
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + 70, y)
    y += 5
    doc.setTextColor(0, 0, 0)
    doc.text("APCC Representative's Signature", margin, y)
    y += 2

    try {
      doc.addImage(adminSignatureDataUrl, "PNG", margin, y, 70, 26)
    } catch {
      doc.text("[Signature]", margin, y + 10)
    }
    y += 30
  }

  // === Page number footers (match original "-- n of N --") ===
  const totalPages = doc.getNumberOfPages()
  for (let n = 1; n <= totalPages; n++) {
    doc.setPage(n)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(140, 140, 140)
    doc.text(
      `-- ${n} of ${totalPages} --`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" },
    )
  }

  const arrayBuffer = doc.output("arraybuffer")
  return Buffer.from(arrayBuffer)
}
