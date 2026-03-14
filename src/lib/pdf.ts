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

  // === Header (match original document) ===
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(50, 50, 50)
  const subtitle = (agreementConfig as { subtitle?: string }).subtitle || "Accelerated Pathways Career College"
  doc.text(subtitle, margin, y)
  y += 7

  doc.setFontSize(12)
  doc.text(agreementConfig.title, margin, y)
  y += 12

  const sections = agreementConfig.sections as SectionLike[]

  // === Numbered sections 1–10 ===
  for (const section of sections) {
    if (y > pageHeight - 40) {
      doc.addPage()
      y = margin
    }

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(50, 50, 50)
    doc.text(section.heading, margin, y)
    y += 6

    y = renderSectionContent(doc, section.content, margin, contentWidth, y, pageHeight)
    y += SECTION_SPACING

    // Section 7: CSR-only table (Start Date, Starting Program, Tuition, Notes) — same alignment as original
    if (section.csrTableOnPdf) {
      if (y > pageHeight - 35) {
        doc.addPage()
        y = margin
      }
      const colW = contentWidth / 4
      const rowH = 8
      const tableY = y
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text("Start Date", margin, tableY + 5)
      doc.text("Starting Program", margin + colW, tableY + 5)
      doc.text("Tuition", margin + colW * 2, tableY + 5)
      doc.text("Notes", margin + colW * 3, tableY + 5)
      doc.setDrawColor(180, 180, 180)
      doc.setLineWidth(0.2)
      doc.rect(margin, tableY, contentWidth, rowH)
      doc.line(margin + colW, tableY, margin + colW, tableY + rowH)
      doc.line(margin + colW * 2, tableY, margin + colW * 2, tableY + rowH)
      doc.line(margin + colW * 3, tableY, margin + colW * 3, tableY + rowH)
      doc.line(margin, tableY + rowH, margin + contentWidth, tableY + rowH)
      y = tableY + rowH + 8
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

  doc.setDrawColor(100, 100, 100)
  doc.setLineWidth(0.3)
  doc.line(margin, y, margin + 70, y)
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text("Student's Signature", margin, y)
  y += 2

  try {
    doc.addImage(signatureDataUrl, "PNG", margin, y, 70, 26)
  } catch {
    doc.text("[Signature]", margin, y + 10)
  }
  y += 32

  doc.setDrawColor(100, 100, 100)
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

  // === APCC REPRESENTATIVE (CSR-only; not visible to student) ===
  if (adminData && adminSignatureDataUrl) {
    if (y > pageHeight - 60) {
      doc.addPage()
      y = margin
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
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

    doc.setDrawColor(100, 100, 100)
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + 70, y)
    y += 5
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
