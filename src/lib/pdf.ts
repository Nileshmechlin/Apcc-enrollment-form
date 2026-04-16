import { jsPDF } from "jspdf"
import { agreementConfig } from "@/config/agreement"
import type { AdminData } from "@/lib/storage"
import { PNG } from "pngjs"

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

function setThemeText(doc: jsPDF) {
  doc.setTextColor(THEME_RGB.r, THEME_RGB.g, THEME_RGB.b)
}

function drawThemedHeading(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  underlineMaxWidth = 90,
) {
  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  setThemeText(doc)
  doc.text(text, x, y)
  doc.setDrawColor(THEME_RGB.r, THEME_RGB.g, THEME_RGB.b)
  doc.setLineWidth(0.45)
  const w = Math.min(doc.getTextWidth(text), underlineMaxWidth)
  doc.line(x, y + 2.5, x + w, y + 2.5)
}

function drawBulletArrow(doc: jsPDF, x: number, baselineY: number) {
  // Draw a small right-pointing arrow as vector (font-independent).
  // baselineY is the text baseline; arrow is vertically centered around it.
  const centerY = baselineY - 1.1
  const shaftLen = 3.2
  const headW = 1.6
  const headH = 1.6

  doc.setDrawColor(30, 30, 30)
  doc.setLineWidth(0.35)
  // shaft
  doc.line(x, centerY, x + shaftLen, centerY)
  // head
  doc.triangle(
    x + shaftLen,
    centerY - headH / 2,
    x + shaftLen,
    centerY + headH / 2,
    x + shaftLen + headW,
    centerY,
    "F",
  )
}

function looksLikePngDataUrl(dataUrl: string): boolean {
  return /^data:image\/png;base64,/i.test(dataUrl)
}

function forcePngInkToBlack(dataUrl: string): string {
  try {
    if (!looksLikePngDataUrl(dataUrl)) return dataUrl
    const base64 = dataUrl.split(",")[1] || ""
    const buffer = Buffer.from(base64, "base64")
    const png = PNG.sync.read(buffer)
    const d = png.data
    // Convert any non-transparent pixel to black (keep alpha)
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]
      if (a === 0) continue
      d[i] = 0
      d[i + 1] = 0
      d[i + 2] = 0
    }
    const out = PNG.sync.write(png)
    return `data:image/png;base64,${out.toString("base64")}`
  } catch {
    return dataUrl
  }
}

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
      const bulletX = margin
      const textX = margin + BULLET_INDENT_MM
      const wrapped = doc.splitTextToSize(text, contentWidth - BULLET_INDENT_MM)
      wrapped.forEach((w: string, index: number) => {
        if (y > pageHeight - 25) {
          doc.addPage()
          y = margin
        }
        // Arrow only on first line; subsequent lines align with text
        if (index === 0) {
          drawBulletArrow(doc, bulletX, y)
          // reset text styling
          doc.setFont("helvetica", "normal")
          doc.setTextColor(50, 50, 50)
        }
        doc.text(w, textX, y)
        y += LINE_HEIGHT
      })
    } else if (isLettered) {
      const label = trimmed.slice(0, 2) // "a)"
      const rest = trimmed.slice(2).trimStart()
      const labelX = margin
      const textX = margin + LETTERED_INDENT_MM
      const wrapped = doc.splitTextToSize(rest, contentWidth - LETTERED_INDENT_MM)
      wrapped.forEach((w: string, index: number) => {
        if (y > pageHeight - 25) {
          doc.addPage()
          y = margin
        }
        if (index === 0) {
          doc.setFont("helvetica", "bold")
          doc.setTextColor(30, 30, 30)
          doc.text(label, labelX, y)
          doc.setFont("helvetica", "normal")
          doc.setTextColor(50, 50, 50)
        }
        doc.text(w, textX, y)
        y += LINE_HEIGHT
      })
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

  // === Header: full-width theme band with centered white title ===
  const headerHeight = 26
  doc.setFillColor(THEME_RGB.r, THEME_RGB.g, THEME_RGB.b)
  doc.rect(0, 0, pageWidth, headerHeight, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text(`${subtitle} Enrollment Agreement`, pageWidth / 2, headerHeight / 2 + 3, {
    align: "center",
  })

  // Move below band
  y = headerHeight + 8

  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  const lastUpdated =
    agreementConfig.lastUpdated?.trim() ||
    new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })
  doc.text(`Last Updated: ${lastUpdated}`, pageWidth / 2, y, { align: "center" })
  y += 10

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

  // === Student Information card (two-column layout) ===
  drawThemedHeading(doc, "Student Information", margin, y, 70)
  y += 6

  const cardX = margin
  const cardY = y
  const cardW = contentWidth
  const rowHeight = 6

  const leftRows: Array<[string, string]> = [
    ["Full Name:", formData.fullName || ""],
    ["Phone:", formData.phone || ""],
    ["Date of Birth:", formData.dateOfBirth || ""],
  ]

  const rightRows: Array<[string, string]> = [
    ["Email:", formData.email || ""],
    ["Course:", formData.course || ""],
    ["Guardian Name:", isMinorStudent ? formData.parentsName || "" : ""],
    ["Date:", formData.date || ""],
  ]

  const visibleRows = Math.max(
    leftRows.filter(([, v]) => v?.trim()).length,
    rightRows.filter(([, v]) => v?.trim()).length,
  )
  const rows = Math.max(visibleRows, 1)
  const cardHeight = rows * rowHeight + 18

  // Card background
  doc.setFillColor(248, 249, 252)
  doc.setDrawColor(225, 227, 234)
  // roundedRect is available in jsPDF
  ;(doc as any).roundedRect(cardX, cardY, cardW, cardHeight, 3, 3, "FD")

  // Content inside card
  let infoY = cardY + 10
  const leftLabelX = cardX + 8
  const leftValueX = leftLabelX + 30
  const rightLabelX = cardX + cardW / 2 + 8
  const rightValueX = rightLabelX + 32

  doc.setFontSize(9)
  doc.setTextColor(50, 50, 50)

  for (let i = 0; i < rows; i++) {
    const [lLabel, lVal] = leftRows[i] || ["", ""]
    const [rLabel, rVal] = rightRows[i] || ["", ""]

    const maxValW = (cardW / 2) - 35

    if (lVal?.trim()) {
      doc.setFont("helvetica", "bold")
      doc.text(lLabel, leftLabelX, infoY)
      doc.setFont("helvetica", "normal")
      doc.text(lVal, leftValueX, infoY, { maxWidth: maxValW })
    }

    if (rVal?.trim()) {
      doc.setFont("helvetica", "bold")
      doc.text(rLabel, rightLabelX, infoY)
      doc.setFont("helvetica", "normal")
      doc.text(rVal, rightValueX, infoY, { maxWidth: maxValW })
    }

    infoY += rowHeight
  }

  y = cardY + cardHeight + 10

  // === Agreement Terms heading ===
  drawThemedHeading(doc, "Agreement Terms", margin, y, 60)
  y += 10

  const sections = agreementConfig.sections as SectionLike[]

  // === Numbered sections 1–10 ===
  for (const section of sections) {
    if (y > pageHeight - 40) {
      doc.addPage()
      y = margin
    }

    // Section headings: themed + underline for separation
    drawThemedHeading(doc, section.heading, margin, y, 95)
    y += 7

    y = renderSectionContent(doc, section.content, margin, contentWidth, y, pageHeight)
    y += SECTION_SPACING + 1

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

      // Notes body: Clean box without ruled lines
      const notesBodyY = notesHeaderY + 6
      const boxPadding = 4
      if (adminData?.notes) {
        doc.setFont("helvetica", "normal")
        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        const wrappedNotes = doc.splitTextToSize(adminData.notes, contentWidth - (boxPadding * 2))
        doc.text(wrappedNotes, margin + boxPadding, notesBodyY + boxPadding + 1)
      }

      // Draw box around notes
      doc.setDrawColor(180, 180, 180)
      doc.rect(margin, notesHeaderY, contentWidth, 36) // Fixed height box for notes area

      y = notesHeaderY + 36 + 6
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
  y += 12

  // Signatures in black (lines and labels), aligned side by side
  const sigColWidth = contentWidth / 2
  const studentX = margin
  const guardianX = margin + sigColWidth
  const lineWidth = 60

  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)

  // Top lines
  doc.line(studentX, y, studentX + lineWidth, y)
  doc.line(guardianX, y, guardianX + lineWidth, y)
  y += 5

  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.text("Student's Signature", studentX, y)
  doc.text("Legal Guardian's Signature (if applicable)", guardianX, y)
  y += 3

  // Signature images aligned under each line
  const imgY = y
  try {
    doc.addImage(forcePngInkToBlack(signatureDataUrl), "PNG", studentX, imgY, lineWidth, 20)
  } catch {
    doc.text("[Signature]", studentX, imgY + 10)
  }

  if (parentSignatureDataUrl) {
    try {
      doc.addImage(forcePngInkToBlack(parentSignatureDataUrl), "PNG", guardianX, imgY, lineWidth, 20)
    } catch {
      doc.text("[Signature]", guardianX, imgY + 10)
    }
  }

  y = imgY + 26
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
      doc.addImage(forcePngInkToBlack(adminSignatureDataUrl), "PNG", margin, y, 70, 26)
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
