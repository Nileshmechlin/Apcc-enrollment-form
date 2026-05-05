import { jsPDF } from "jspdf"
import { agreementConfig } from "@/config/agreement"
import type { AdminData } from "@/lib/storage"
import { PNG } from "pngjs"
import fs from "fs"
import path from "path"

interface PdfFormData {
  [key: string]: string
}

const LINE_HEIGHT = 5
const THEME_RGB = { r: 166, g: 128, b: 69 }

// Path to converted logo
const LOGO_PATH = path.join(process.cwd(), "src", "APCC-Logo.png")

function renderWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  const paragraphs = text.split("\n")
  let currentY = y

  paragraphs.forEach(para => {
    const trimmed = para.trim()
    if (!trimmed) {
      currentY += 2
      return
    }

    const isBullet = trimmed.startsWith("➔")
    const cleanPara = isBullet ? trimmed.replace("➔", "").trim() : trimmed
    const indent = isBullet ? 6 : 0
    const effectiveWidth = maxWidth - indent
    
  const lines: string[] = doc.splitTextToSize(cleanPara, effectiveWidth)
  
  lines.forEach((line: string, index: number) => {
    if (isBullet && index === 0) {
      drawBulletArrow(doc, x, currentY + 3.5)
    }
    doc.text(line, x + indent, currentY + 5.0) // Increased line height to 5.0mm
    currentY += 5.0
  })
  
  currentY += 2.0 // Space between paragraphs
})

return currentY
}

function setThemeText(doc: jsPDF) {
  doc.setTextColor(THEME_RGB.r, THEME_RGB.g, THEME_RGB.b)
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number, signatureDataUrl?: string) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const y = pageHeight - 15
  const margin = 25
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  
  // Left: Signature Line (Simplified)
  doc.setLineWidth(0.3)
  const lineLength = 22
  doc.line(margin, y + 1, margin + lineLength, y + 1)
  
  if (signatureDataUrl) {
    try {
      const blackSignature = forcePngInkToBlack(signatureDataUrl)
      // Position signature neatly on the line (sitting exactly on it)
      doc.addImage(blackSignature, "PNG", margin + 2, y - 8, 18, 9)
    } catch (e) {
      console.error("Error drawing footer signature:", e)
    }
  }
  
  // Center: Page X of 11
  doc.setFont("helvetica", "normal")
  doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, y, { align: "center" })
  
  // Right: Date
  doc.text("January 15, 2026", pageWidth - margin, y, { align: "right" })
}

function drawBulletArrow(doc: jsPDF, x: number, y: number) {
  doc.setLineWidth(0.3)
  doc.setDrawColor(0, 0, 0)
  doc.setFillColor(0, 0, 0)
  // Shaft
  const shaftY = y - 0.8
  doc.line(x, shaftY, x + 2.5, shaftY)
  // Arrowhead
  doc.triangle(x + 2, shaftY - 0.8, x + 2, shaftY + 0.8, x + 4, shaftY, "F")
}

function drawLogoHeader(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth()
  const textMargin = 25
  const logoX = 10 // Logo is significantly offset to the left
  
  try {
    if (fs.existsSync(LOGO_PATH)) {
      const logoData = fs.readFileSync(LOGO_PATH).toString("base64")
      doc.addImage(logoData, "PNG", logoX, 10, 18, 18)
    }
  } catch (e) {
    console.error("Logo error:", e)
  }
  
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text("Accelerated Pathways Career College", pageWidth - textMargin, 14, { align: "right" })
}

function forcePngInkToBlack(dataUrl: string): string {
  try {
    if (!/^data:image\/png;base64,/i.test(dataUrl)) return dataUrl
    const base64 = dataUrl.split(",")[1] || ""
    const buffer = Buffer.from(base64, "base64")
    const png = PNG.sync.read(buffer)
    const d = png.data
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]
      if (a === 0) continue
      d[i] = 0; d[i + 1] = 0; d[i + 2] = 0
    }
    const out = PNG.sync.write(png)
    return `data:image/png;base64,${out.toString("base64")}`
  } catch {
    return dataUrl
  }
}

function drawTable(doc: jsPDF, x: number, y: number, width: number, headers: string[], rows: string[][], colWidths?: number[]) {
  const baseRowHeight = 7
  const padding = 2
  let currentY = y
  const widths = colWidths || headers.map(() => width / headers.length)

  // Calculate Header Height
  doc.setFont("helvetica", "bold"); doc.setFontSize(9)
  let maxHeaderHeight = baseRowHeight
  headers.forEach((header, i) => {
    const lines = doc.splitTextToSize(header, widths[i] - padding * 2).length
    const h = (lines * 4) + 2
    if (h > maxHeaderHeight) maxHeaderHeight = h
  })

  // Header Background
  doc.setFillColor(235, 235, 235)
  doc.rect(x, currentY, width, maxHeaderHeight, "F")
  
  doc.setTextColor(0, 0, 0)
  doc.setDrawColor(180, 180, 180)
  
  let currentX = x
  headers.forEach((header, i) => {
    doc.rect(currentX, currentY, widths[i], maxHeaderHeight)
    // Vertically center text in header
    const lines = doc.splitTextToSize(header, widths[i] - padding * 2)
    const textY = currentY + (maxHeaderHeight / 2) - (lines.length * 2) + 3
    doc.text(lines, currentX + padding, textY)
    currentX += widths[i]
  })
  currentY += maxHeaderHeight

  doc.setFont("helvetica", "normal"); doc.setFontSize(9)
  rows.forEach((row) => {
    // Calculate Row Height
    let maxRowHeight = baseRowHeight
    row.forEach((cell, i) => {
      const lines = doc.splitTextToSize(cell || "", widths[i] - padding * 2).length
      const h = (lines * 4) + 2
      if (h > maxRowHeight) maxRowHeight = h
    })

    currentX = x
    row.forEach((cell, i) => {
      doc.rect(currentX, currentY, widths[i], maxRowHeight)
      const options: any = {}
      let textX = currentX + padding
      if (headers.length === 2 && i === 1) {
        options.align = "center"
        textX = currentX + widths[i] / 2
      }
      
      const lines = doc.splitTextToSize(cell || "", widths[i] - padding * 2)
      const textY = currentY + (maxRowHeight / 2) - (lines.length * 2) + 3
      doc.text(lines, textX, textY, options)
      currentX += widths[i]
    })
    currentY += maxRowHeight
  })
  return currentY
}

export async function generatePDF(
  formData: PdfFormData,
  signatureDataUrl: string,
  adminData?: AdminData,
  adminSignatureDataUrl?: string,
  parentSignatureDataUrl?: string | null,
): Promise<Buffer> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 25 // Match the screenshot's wider body margin
  const contentWidth = pageWidth - margin * 2
  const pageHeight = doc.internal.pageSize.getHeight()
  const totalPages = 11

  // --- Page 1: Exact Replication of Table ---
  drawLogoHeader(doc)
  let y = 35
  doc.setFont("helvetica", "bold")
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text("Accelerated Pathways Career College (APCC)", pageWidth / 2, y, { align: "center" })
  y += 8
  doc.text("Enrollment Agreement", pageWidth / 2, y, { align: "center" })
  y += 12

  // Table Logic
  const rowH = 9 // Increased height for stretched look
  const headerH = 10 // Taller headers
  const tableMargin = margin
  const col1W = contentWidth * 0.6
  const col2W = contentWidth * 0.4

  const drawRow = (label: string, value: string, currentY: number, labelW = 45) => {
    doc.setDrawColor(0)
    doc.setLineWidth(0.2)
    
    // Calculate required height for value
    const lines = doc.splitTextToSize(value, contentWidth - labelW - 2)
    const h = Math.max(rowH, (lines.length * 4) + 4)
    
    doc.rect(tableMargin, currentY, contentWidth, h)
    doc.setFont("helvetica", "bold"); doc.setFontSize(9)
    doc.text(label, tableMargin + 2, currentY + (h/2) + 1, { baseline: "middle" })
    doc.setFont("helvetica", "normal")
    doc.text(value, tableMargin + labelW, currentY + (h/2) + 1, { maxWidth: contentWidth - labelW - 2, baseline: "middle" })
    return currentY + h
  }

  const drawHeaderRow = (text: string, currentY: number, subtext?: string) => {
    doc.setFillColor(230, 230, 230)
    doc.rect(tableMargin, currentY, contentWidth, headerH, "F")
    doc.setDrawColor(0)
    doc.rect(tableMargin, currentY, contentWidth, headerH)
    doc.setFont("helvetica", "bold"); doc.setFontSize(10)
    doc.text(text, pageWidth / 2, currentY + 5, { align: "center" })
    if (subtext) {
      doc.setFontSize(7); doc.setFont("helvetica", "normal")
      doc.text(subtext, pageWidth / 2, currentY + 8, { align: "center" })
    }
    return currentY + headerH
  }

  // Student Info
  y = drawHeaderRow("Student Information", y)
  
  // Split row: Name | DOB
  doc.rect(tableMargin, y, contentWidth, rowH)
  doc.line(tableMargin + col1W, y, tableMargin + col1W, y + rowH)
  doc.setFont("helvetica", "bold"); doc.text("Student Name:", tableMargin + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.fullName || "", tableMargin + 30, y + 5.5)
  doc.setFont("helvetica", "bold"); doc.text("DOB:", tableMargin + col1W + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.dateOfBirth || "", tableMargin + col1W + 15, y + 5.5)
  y += rowH

  // Address Row
  const addrH = rowH * 2
  doc.rect(tableMargin, y, contentWidth, addrH)
  doc.setFont("helvetica", "bold"); doc.text("Address:", tableMargin + 2, y + 5.5)
  doc.setFontSize(7); doc.text("(street address, additional address details, city, state, ZIP code)", tableMargin + 18, y + 5.5)
  doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.text(formData.address || "", tableMargin + 2, y + 11, { maxWidth: contentWidth - 4 })
  y += addrH

  // Phone | Email
  doc.rect(tableMargin, y, contentWidth, rowH)
  doc.line(tableMargin + col1W, y, tableMargin + col1W, y + rowH)
  doc.setFont("helvetica", "bold"); doc.text("Phone:", tableMargin + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.phone || "", tableMargin + 15, y + 5.5)
  doc.setFont("helvetica", "bold"); doc.text("E-mail:", tableMargin + col1W + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.email || "", tableMargin + col1W + 15, y + 5.5)
  y += rowH

  // Parents
  y = drawHeaderRow("Student’s Parents / Legal Guardian(s)", y, "(required if the Student is a minor)")
  y = drawRow("1st Name:", formData.parent1Name || "", y, 25)
  y = drawRow("Address:", formData.parent1Address || "", y, 25)
  
  doc.rect(tableMargin, y, contentWidth, rowH)
  doc.line(tableMargin + col1W, y, tableMargin + col1W, y + rowH)
  doc.setFont("helvetica", "bold"); doc.text("Phone:", tableMargin + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.parent1Phone || "", tableMargin + 15, y + 5.5)
  doc.setFont("helvetica", "bold"); doc.text("E-mail:", tableMargin + col1W + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.parent1Email || "", tableMargin + col1W + 15, y + 5.5)
  y += rowH

  y = drawRow("2nd Name:", formData.parent2Name || "", y, 25)
  y = drawRow("Address:", formData.parent2Address || "", y, 25)
  
  doc.rect(tableMargin, y, contentWidth, rowH)
  doc.line(tableMargin + col1W, y, tableMargin + col1W, y + rowH)
  doc.setFont("helvetica", "bold"); doc.text("Phone:", tableMargin + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.parent2Phone || "", tableMargin + 15, y + 5.5)
  doc.setFont("helvetica", "bold"); doc.text("E-mail:", tableMargin + col1W + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.parent2Email || "", tableMargin + col1W + 15, y + 5.5)
  y += rowH

  // Emergency
  y = drawHeaderRow("Information in Case of Emergency", y)
  y = drawRow("Emergency Contact Name:", formData.emergencyName || "", y, 45)
  
  doc.rect(tableMargin, y, contentWidth, rowH)
  doc.line(tableMargin + col1W, y, tableMargin + col1W, y + rowH)
  doc.setFont("helvetica", "bold"); doc.text("Relationship:", tableMargin + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.emergencyRelationship || "", tableMargin + 25, y + 5.5)
  doc.setFont("helvetica", "bold"); doc.text("Phone:", tableMargin + col1W + 2, y + 5.5)
  doc.setFont("helvetica", "normal"); doc.text(formData.emergencyPhone || "", tableMargin + col1W + 15, y + 5.5)
  y += rowH

  // Medical
  const medH = 30
  doc.rect(tableMargin, y, contentWidth, medH)
  doc.line(tableMargin + 35, y, tableMargin + 35, y + medH)
  doc.setFont("helvetica", "bold")
  doc.text("Do you have any", tableMargin + 2, y + 6)
  doc.text("medical conditions", tableMargin + 2, y + 11)
  doc.text("that require special", tableMargin + 2, y + 16)
  doc.text("consideration?", tableMargin + 2, y + 21)
  doc.setFontSize(7); doc.setFont("helvetica", "normal")
  doc.text("(Allergies, medications, specific medical accommodations, etc.)", tableMargin + 37, y + 5.5)
  doc.setFontSize(9); doc.text(formData.medicalConditions || "None.", tableMargin + 37, y + 12, { maxWidth: contentWidth - 39 })
  y += medH

  // HS Diploma
  const dipH = 10
  doc.rect(tableMargin, y, contentWidth, dipH)
  doc.line(tableMargin + contentWidth - 40, y, tableMargin + contentWidth - 40, y + dipH)
  doc.setFont("helvetica", "bold"); doc.text("Do you have a High School Diploma or equivalent (GED)?", tableMargin + 2, y + 6)
  doc.setFont("helvetica", "normal"); doc.text(formData.highSchoolDiploma || "", tableMargin + contentWidth - 38, y + 6)

  drawFooter(doc, 1, totalPages, signatureDataUrl)

  // --- Pages 2-11 ---
  const pages = agreementConfig.pages
  for (let i = 1; i < pages.length; i++) {
    doc.addPage()
    drawLogoHeader(doc)
    let currentY = 35
    
    const page = pages[i]
    const content = page.content

    // Custom Page 2 Handling (Screenshot match)
    if (page.number === 2) {
      // Titles: Bold, Size 20
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
      doc.text("Financial Obligations", margin, currentY, { maxWidth: contentWidth });
      let lines = doc.splitTextToSize("Financial Obligations", contentWidth).length
      currentY += (lines * 7) + 2 // Tight gap below title
      
      // Paragraphs: Regular, Size 10
      doc.setFont("helvetica", "normal"); doc.setFontSize(10)
      const p1 = "“Financial Obligations” shall include, but are not limited to, the total program cost, as well as any ancillary charges incurred during the academic period. These may include costs related to books, supplies, externship participation, meals, health services, student activities, security deposits, replacement of lost property (e.g., keys or materials), damage restitution, returned check fees, and late payment fees. All such fees shall be assessed in accordance with the official tuition and fee schedule published by Accelerated Pathways Career College prior to the commencement of the applicable academic cycle."
      currentY = renderWrappedText(doc, p1, margin, currentY, contentWidth) + 10 // Large gap before next title

      doc.setFont("helvetica", "bold"); doc.setFontSize(20)
      doc.text("Tuition Payment", margin, currentY, { maxWidth: contentWidth });
      lines = doc.splitTextToSize("Tuition Payment", contentWidth).length
      currentY += (lines * 7) + 2
      
      doc.setFont("helvetica", "normal"); doc.setFontSize(10)
      const tuitionVal = adminData?.tuition || adminData?.totalTuition || "__________"
      const p2 = `The Student understands that this Course carries a tuition cost of $${tuitionVal} USD.\nPayments must be done in accordance to one of the three options available to the Student.`
      currentY = renderWrappedText(doc, p2, margin, currentY, contentWidth) + 4

      const p3 = "For APCC Comprehensive Courses, the payment of a registration fee of $50 is due with the signing of the Enrollment Agreement. All students qualify for the following payment options:"
      currentY = renderWrappedText(doc, p3, margin, currentY, contentWidth) + 8

      // Option 1: Mixed Bold and Bold-Italic
      doc.setFont("helvetica", "bold"); doc.setFontSize(12)
      doc.text("Payment Option 1: ", margin, currentY)
      const opt1Width = doc.getTextWidth("Payment Option 1: ")
      doc.setFont("helvetica", "bolditalic")
      doc.text("Full Upfront Payment", margin + opt1Width, currentY)
      currentY += 8

      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5)
      const p4 = "Pay full balance of tuition & supplies prior to the start of the program. Payable by cash, check, money order or credit card."
      currentY = renderWrappedText(doc, p4, margin, currentY, contentWidth) + 8

      // Option 2: Mixed Bold and Bold-Italic
      doc.setFont("helvetica", "bold"); doc.setFontSize(12)
      doc.text("Payment Option 2: ", margin, currentY)
      const opt2Width = doc.getTextWidth("Payment Option 2: ")
      doc.setFont("helvetica", "bolditalic")
      doc.text("Deferred Automatic Payments Plan", margin + opt2Width, currentY)
      currentY += 8

      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5)
      const p5 = "At Accelerated Pathways Career College (APCC), students have the option to pay via a program to get deferred payments in monthly installments in any of the following amounts:"
      currentY = renderWrappedText(doc, p5, margin, currentY, contentWidth) + 4

      // Bullets (Indented)
      const bullets = ["➔ $100.00", "➔ $200.00", "➔ $500.00"]
      bullets.forEach(b => {
        currentY = renderWrappedText(doc, b, margin + 10, currentY, contentWidth - 10)
      })
      currentY += 4

      const p6 = "For this option, it is necessary to authorize automatic payments via debit or credit card information provided at enrollment."
      currentY = renderWrappedText(doc, p6, margin, currentY, contentWidth) + 6

      const p7 = "By selecting this option, you agree to have your debit or credit card charged on the dates specified in the payment schedule and commit to maintaining sufficient funds or credit in your account."
      currentY = renderWrappedText(doc, p7, margin, currentY, contentWidth) + 6

      const p8 = "It is your responsibility to keep your debit or credit card information accurate and up-to-date. If any changes occur, such as a new expiration date or billing address, you must notify APCC promptly to avoid payment issues or service suspension."
      currentY = renderWrappedText(doc, p8, margin, currentY, contentWidth)

      drawFooter(doc, 2, totalPages, signatureDataUrl)
      continue
    }

    // Custom Page 3 Handling (Screenshot match)
    if (page.number === 3) {
      const sections = content.split("\n\n")
      sections.forEach(section => {
        const trimmed = section.trim()
        if (!trimmed) return

        if (trimmed.startsWith("Payment Option 3")) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(12)
          doc.text("Payment Option 3: ", margin, currentY)
          const opt3Width = doc.getTextWidth("Payment Option 3: ")
          doc.setFont("helvetica", "bolditalic")
          doc.text("Career Membership Program", margin + opt3Width, currentY)
          currentY += 8
          
          const body = trimmed.replace(/Payment Option 3: Career Membership Program\n?/, "").trim()
          doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(0)
          currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 2
        } else {
          doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(0)
          currentY = renderWrappedText(doc, trimmed, margin, currentY, contentWidth) + 4
        }
      })
      
      drawFooter(doc, page.number, totalPages, signatureDataUrl)
      continue
    }

    // Custom Page 4 Handling (Screenshot match)
    if (page.number === 4) {
      currentY = 35 // Start safely below the logo header
      const sections = content.split("\n\n")
      for (const section of sections) {
        const trimmed = section.trim()
        if (!trimmed) continue
        
        // Safety check to prevent overlap with footer (Tightened for Page 4 match)
        if (currentY > pageHeight - 25) break;

        if (trimmed.startsWith("Cancellation and Refund Policy")) {
          currentY += 8 // Ultra-tight gap before main title
          doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
          doc.text("Cancellation and Refund Policy", margin, currentY, { maxWidth: contentWidth });
          const titleLines = doc.splitTextToSize("Cancellation and Refund Policy", contentWidth).length
          currentY += (titleLines * 7) + 1.5 
          
          const body = trimmed.replace("Cancellation and Refund Policy\n", "").replace("Cancellation and Refund Policy", "").trim()
          if (body) {
            doc.setFont("helvetica", "normal"); doc.setFontSize(10)
            currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 4 // Ultra-tight gap
          }
        } else if (trimmed.includes("Three-Day Cancellation Window") || 
                   trimmed.includes("Pre-Class Cancellation") || 
                   trimmed.includes("Post-Class Start Cancellation")) {
          const lines = trimmed.split("\n")
          const title = lines[0]
          currentY += 6 // Ultra-tight gap before subtitle
          doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(0, 0, 0)
          doc.text(title, margin, currentY, { maxWidth: contentWidth });
          const subTitleLines = doc.splitTextToSize(title, contentWidth).length
          currentY += (subTitleLines * 5) + 1.2 
          
          const body = lines.slice(1).join("\n").trim()
          doc.setFont("helvetica", "normal"); doc.setFontSize(10)
          currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 4 // Ultra-tight gap
        } else {
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
          currentY = renderWrappedText(doc, trimmed, margin, currentY, contentWidth) + 4 // Ultra-tight gap
        }
      }
      
      drawFooter(doc, 4, totalPages, signatureDataUrl)
      continue
    }

    // Page 8 Handling (Payment Summary - Exact template match)
    if (page.number === 8) {
      currentY = 35
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
      doc.text("Payment Summary", margin, currentY, { maxWidth: contentWidth });
      const titleLines = doc.splitTextToSize("Payment Summary", contentWidth).length
      currentY += (titleLines * 7) + 3

      const introText = content.split("(CSR Table: Payment Summary)")[0].replace("Payment Summary\n", "").trim()
      doc.setFont("helvetica", "normal"); doc.setFontSize(10)
      currentY = renderWrappedText(doc, introText, margin, currentY, contentWidth) + 8

      // Draw Main Table (7 columns with custom widths)
      const colWidths1 = [20, 20, 35, 15, 15, 20, 35]
      currentY = drawTable(doc, margin, currentY, contentWidth, 
        ["Start Date", "End Date*", "Selected Program", "Tuition", "Reg. Fee", "Class Hours", "Extern/ Intern Hours"],
        [[
          adminData?.startDate || "", 
          adminData?.endDate || "", 
          adminData?.selectedProgram || "", 
          adminData?.tuition ? `$${adminData.tuition}` : "$", 
          adminData?.registrationFee ? `$ ${adminData.registrationFee}` : "$ 50", 
          adminData?.classHours || "", 
          adminData?.externHours || ""
        ]],
        colWidths1
      )
      
      currentY += 2
      doc.setFont("helvetica", "italic"); doc.setFontSize(8)
      const note = "* Students shall retain access to the online components of the course until either (i) the date of certification completion or (ii) six (6) months from the date of course completion, whichever occurs first. Extensions beyond this period may be granted at the sole discretion of APCC on a case-by-case basis."
      currentY = renderWrappedText(doc, note, margin, currentY, contentWidth) + 10

      // Draw Additional Services Table Header (Styled Gray)
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
      doc.setFillColor(220, 220, 220); doc.rect(margin, currentY, contentWidth, 7, 'F');
      doc.text("ADDITIONAL SERVICES/FEES", margin + contentWidth/2, currentY + 5, { align: "center" });
      currentY += 7

      // Draw Additional Services Table Content (with custom widths)
      const colWidths2 = [30, 35, 35, 25, 35]
      currentY = drawTable(doc, margin, currentY, contentWidth,
        ["Certification fees", "Books and study materials", "Externship administration", "Parking", "GED Tutoring (Up to 40 hours)"],
        [["Student's responsibility", "Student's responsibility", "Included", "Included", "Included"]],
        colWidths2
      )

      drawFooter(doc, 8, totalPages, signatureDataUrl)
      continue
    }

    // Page 9 Handling (Financial Responsibility Acceptance - Exact template match)
    if (page.number === 9) {
      currentY = 35
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
      doc.text("Financial Responsibility Acceptance", margin, currentY, { maxWidth: contentWidth });
      const titleLines = doc.splitTextToSize("Financial Responsibility Acceptance", contentWidth).length
      currentY += (titleLines * 7) + 3

      const mainParts = content.split("(CSR Table: Program Selection Summary)")
      const textParts = mainParts[0].replace("Financial Responsibility Acceptance\n", "").split("\n\n")
      
      doc.setFont("helvetica", "normal"); doc.setFontSize(10)
      for (const part of textParts) {
        if (part.includes("THIS DOCUMENT CONSTITUTES")) {
          doc.setFont("helvetica", "bold")
        } else {
          doc.setFont("helvetica", "normal")
        }
        currentY = renderWrappedText(doc, part.trim(), margin, currentY, contentWidth) + 8
      }

      currentY += 4
      // Draw Selected Program Table
      currentY = drawTable(doc, margin, currentY, contentWidth,
        ["Selected Program", "Payments starting date", "Total tuition"],
        [[
          adminData?.selectedProgram || "", 
          adminData?.paymentsStartingDate || "", 
          adminData?.totalTuition ? `${adminData.totalTuition} USD` : "USD"
        ]]
      )

      currentY += 4
      // Draw Notes Box (Styled Gray Header + Empty Rect with text)
      doc.setFont("helvetica", "bold"); doc.setFontSize(10)
      doc.setFillColor(220, 220, 220); doc.rect(margin, currentY, contentWidth, 7, 'F');
      doc.text("Notes", margin + 2, currentY + 5);
      currentY += 7
      
      const notesText = adminData?.notes || ""
      const notesLines = doc.splitTextToSize(notesText, contentWidth - 4)
      const notesBoxH = Math.max(45, (notesLines.length * 5) + 10)
      doc.rect(margin, currentY, contentWidth, notesBoxH) 
      doc.setFont("helvetica", "normal"); doc.setFontSize(10)
      doc.text(notesLines, margin + 2, currentY + 7)
      currentY += notesBoxH
      
      drawFooter(doc, 9, totalPages, signatureDataUrl)
      continue
    }

    // Custom Page 10 Handling (Screenshot match)
    if (page.number === 10) {
      currentY = 35 // Start safely below the logo header
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
      doc.text("Contract Acknowledgement", margin, currentY, { maxWidth: contentWidth });
      const titleLines = doc.splitTextToSize("Contract Acknowledgement", contentWidth).length
      currentY += (titleLines * 7) + 3

      const paragraphs = content.replace("Contract Acknowledgement\n", "").split("\n\n")
      doc.setFont("helvetica", "normal"); doc.setFontSize(10)
      for (const p of paragraphs) {
        const trimmed = p.trim()
        if (!trimmed) continue

        // Safety check to prevent overlap with footer
        if (currentY > pageHeight - 35) break;

        currentY = renderWrappedText(doc, trimmed, margin, currentY, contentWidth) + 8
      }
      drawFooter(doc, 10, totalPages, signatureDataUrl)
      continue
    }

    // Custom Page 7 Handling (Screenshot match)
    if (page.number === 7) {
      currentY = 35 // Start safely below the logo header
      const sections = content.split("\n\n")
      for (const section of sections) {
        const trimmed = section.trim()
        if (!trimmed) continue
        
        // Safety check to prevent overlap with footer
        if (currentY > pageHeight - 35) break;

        const lines = trimmed.split("\n")
        const firstLine = lines[0]
        
        // Detect titles
        const isMainTitle = firstLine.startsWith("Course Withdrawal, Academic Standing")
        const isSubtitle = !isMainTitle && firstLine.length < 60 && lines.length > 1 && !firstLine.includes(".") && !/^\d\./.test(firstLine)
        
        if (isMainTitle) {
          currentY += 12 // Significant gap before main title
          doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
          doc.text(firstLine, margin, currentY, { maxWidth: contentWidth });
          const titleLines = doc.splitTextToSize(firstLine, contentWidth).length
          currentY += (titleLines * 7) + 1.5

          const body = lines.slice(1).join("\n").trim()
          doc.setFont("helvetica", "normal"); doc.setFontSize(10)
          currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 6
        } else if (isSubtitle) {
          currentY += 8 // Balanced gap before subtitle
          doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(0, 0, 0)
          doc.text(firstLine, margin, currentY, { maxWidth: contentWidth });
          const subTitleLines = doc.splitTextToSize(firstLine, contentWidth).length
          currentY += (subTitleLines * 5) + 1.2

          const body = lines.slice(1).join("\n").trim()
          doc.setFont("helvetica", "normal"); doc.setFontSize(10)
          currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 6
        } else {
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
          currentY = renderWrappedText(doc, trimmed, margin, currentY, contentWidth) + 6
        }
      }
      drawFooter(doc, 7, totalPages, signatureDataUrl)
      continue
    }

    // Custom Page 6 Handling (Screenshot match)
    if (page.number === 6) {
      currentY = 35 // Start safely below the logo header
      const sections = content.split("\n\n")
      for (const section of sections) {
        const trimmed = section.trim()
        if (!trimmed) continue

        // Safety check to prevent overlap with footer
        if (currentY > pageHeight - 35) break;

        const lines = trimmed.split("\n")
        const firstLine = lines[0]
        
        // Detect if first line is a title
        const isMainTitle = firstLine === "Agreement to Pay"
        const isSubtitle = !isMainTitle && firstLine.length < 60 && lines.length > 1 && !firstLine.includes(".")
        
        if (isMainTitle) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
          doc.text(firstLine, margin, currentY, { maxWidth: contentWidth });
          const titleLines = doc.splitTextToSize(firstLine, contentWidth).length
          currentY += (titleLines * 7) + 1.5

          const body = lines.slice(1).join("\n").trim()
          doc.setFont("helvetica", "normal"); doc.setFontSize(10)
          currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 4
        } else if (isSubtitle) {
          currentY += 6 // Tightened gap before subtitle
          doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(0, 0, 0)
          doc.text(firstLine, margin, currentY, { maxWidth: contentWidth });
          const subTitleLines = doc.splitTextToSize(firstLine, contentWidth).length
          currentY += (subTitleLines * 5) + 1.2

          const body = lines.slice(1).join("\n").trim()
          doc.setFont("helvetica", "normal"); doc.setFontSize(10)
          currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 4
        } else {
          doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
          currentY = renderWrappedText(doc, trimmed, margin, currentY, contentWidth) + 4
        }
      }
      drawFooter(doc, 6, totalPages, signatureDataUrl)
      continue
    }

    // Custom handling for specific pages with tables
    if (page.number === 5) { // Page 5 (Refund Table)
      // Render continuation text first (from the start of content until the table intro)
      const parts = content.split("Percentage Completed | Minimum Refund")
      const introPart = parts[0].trim()
      
      // Split introPart to handle the continuation sentence and the table header separately
      const introLines = introPart.split("\n\n")
      if (introLines[0]) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
        currentY = renderWrappedText(doc, introLines[0].trim(), margin, currentY, contentWidth) + 4
      }
      
      if (introLines[1]) {
        doc.setFont("helvetica", "normal"); doc.setFontSize(10)
        currentY = renderWrappedText(doc, introLines[1].trim(), margin, currentY, contentWidth) + 4
      }
      
      currentY = drawTable(doc, margin, currentY, contentWidth, ["Percentage of Course Completed", "Minimum Tuition Refund"], [
        ["Course not yet begun", "100%"],
        ["10% or less", "90%"],
        [">10% – ≤20%", "80%"],
        [">20% – ≤30%", "70%"],
        [">30% – ≤40%", "60%"],
        [">40% – ≤50%", "50%"],
        ["Over 50%", "No refund, or as determined by the Institution."]
      ])
      currentY += 15 // Significant gap after table

      // Now draw the Student Financial Responsibilities title (Size 20)
      doc.setFont("helvetica", "bold"); doc.setFontSize(20); doc.setTextColor(0, 0, 0)
      doc.text("Student Financial Responsibilities", margin, currentY, { maxWidth: contentWidth }); 
      const sfrLines = doc.splitTextToSize("Student Financial Responsibilities", contentWidth).length
      currentY += (sfrLines * 7) + 1.5 // Tight gap

      // Render the rest of the page
      const remainingContent = parts[1]?.split("Student Financial Responsibilities")[1] || ""
      if (remainingContent) {
        const sections = remainingContent.split("\n\n")
        for (const section of sections) {
          const trimmed = section.trim()
          if (!trimmed) continue
          
          if (currentY > pageHeight - 45) break;

          const lines = trimmed.split("\n")
          const firstLine = lines[0]
          // Detect subtitles like "Scope of...", "Payment Terms"
          if (firstLine.length < 60 && lines.length > 1 && !firstLine.includes(".")) {
            currentY += 12 // Significant gap before subtitle
            doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.setTextColor(0, 0, 0)
            doc.text(firstLine, margin, currentY, { maxWidth: contentWidth });
            const subTitleLines = doc.splitTextToSize(firstLine, contentWidth).length
            currentY += (subTitleLines * 5) + 1.2
            
            const body = lines.slice(1).join("\n").trim()
            doc.setFont("helvetica", "normal"); doc.setFontSize(10)
            currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 8
          } else {
            doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(0, 0, 0)
            currentY = renderWrappedText(doc, trimmed, margin, currentY, contentWidth) + 8
          }
        }
      }
      
      drawFooter(doc, 5, totalPages, signatureDataUrl)
      continue
    } else if (page.number === 8) { // Page 8 (Payment Summary)
      const lines = content.split("Payment Summary")[0]
      if (lines) {
        const wrapped = doc.splitTextToSize(lines, contentWidth)
        doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(0, 0, 0)
        doc.text(wrapped, margin, currentY); currentY += wrapped.length * 5 + 5
      }
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("Payment Summary", margin, currentY); currentY += 8
      doc.setFont("helvetica", "normal"); doc.setFontSize(10.5)
      const intro = "The Student, together with the Student’s Parents or Guardians and any Co-Signers (collectively, the “Obligors”), shall be jointly and severally responsible for payment..."
      const wrappedIntro = doc.splitTextToSize(intro, contentWidth)
      doc.text(wrappedIntro, margin, currentY); currentY += wrappedIntro.length * 5 + 8
      
      currentY = drawTable(doc, margin, currentY, contentWidth, ["Start Date", "End Date", "Selected Program", "Tuition", "Reg. Fee", "Class Hours", "Extern Hours"], [
        [adminData?.startDate || "", adminData?.endDate || "", adminData?.selectedProgram || "", adminData?.tuition || "", adminData?.registrationFee || "50", adminData?.classHours || "", adminData?.externHours || ""]
      ], [22, 22, 40, 20, 18, 25, 25])
      currentY += 5
      doc.setFontSize(7); doc.text("* Students shall retain access to online components...", margin, currentY); currentY += 10
      
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("ADDITIONAL SERVICES/FEES", margin, currentY); currentY += 5
      currentY = drawTable(doc, margin, currentY, contentWidth, ["Service", "Charge"], [
        ["Certification fees", "Student’s responsibility"],
        ["Books and study materials", "Student’s responsibility"],
        ["Externship administration", "Included"],
        ["Parking", "Included"],
        ["GED Tutoring (Up to 40 hours)", "Included"]
      ])
    } else if (page.number === 9) { // Page 9 (Financial Responsibility)
      const lines = content.split("Financial Responsibility Acceptance")[0]
      if (lines) {
        const wrapped = doc.splitTextToSize(lines, contentWidth)
        doc.setFont("helvetica", "normal"); doc.setFontSize(10.5); doc.setTextColor(0, 0, 0)
        doc.text(wrapped, margin, currentY); currentY += wrapped.length * 5 + 5
      }
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.text("Financial Responsibility Acceptance", margin, currentY); currentY += 8
      const body = "The undersigned acknowledge and agree to be fully and unconditionally responsible..."
      const wrappedBody = doc.splitTextToSize(body, contentWidth)
      doc.setFont("helvetica", "normal"); doc.text(wrappedBody, margin, currentY); currentY += wrappedBody.length * 5 + 10
      
      currentY = drawTable(doc, margin, currentY, contentWidth, ["Selected Program", "Payments starting date", "Total tuition", "Notes"], [
        [adminData?.selectedProgram || "", adminData?.paymentsStartingDate || "", adminData?.totalTuition || "", adminData?.notes || ""]
      ], [40, 40, 30, 60])
    } else if (page.number === 11) { // Page 11 (Signatures)
      // Determine if minor (under 18)
      const birth = formData.dateOfBirth ? new Date(formData.dateOfBirth) : null
      let isMinor = false
      if (birth && !isNaN(birth.getTime())) {
        const today = new Date()
        let age = today.getFullYear() - birth.getFullYear()
        const m = today.getMonth() - birth.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
        isMinor = age < 18
      }

      doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text("STUDENT", margin, currentY); currentY += 10
      doc.setFont("helvetica", "normal"); doc.setFontSize(10)
      doc.text(`Name: ${formData.fullName || ""}`, margin, currentY); currentY += 8
      
      const guardianName = formData.parent1Name || formData.parent2Name || ""
      doc.text(`Legal Guardian’s Name: ${isMinor ? guardianName : "(N/A)"}`, margin, currentY); currentY += 8
      doc.text(`Signature Dated: ${formData.date || new Date().toLocaleDateString()}`, margin, currentY); currentY += 15
      
      // Student Signature
      doc.line(margin, currentY + 15, margin + 80, currentY + 15)
      doc.text("Student’s Signature", margin, currentY + 20)
      if (signatureDataUrl) {
        try { doc.addImage(forcePngInkToBlack(signatureDataUrl), "PNG", margin, currentY, 70, 15) } catch {}
      }
      
      currentY += 35
      // Legal Guardian Signature (Only if minor)
      if (isMinor) {
        doc.line(margin, currentY + 15, margin + 80, currentY + 15)
        doc.text("Legal Guardian's Signature", margin, currentY + 20)
        if (parentSignatureDataUrl) {
          try { doc.addImage(forcePngInkToBlack(parentSignatureDataUrl), "PNG", margin, currentY, 70, 15) } catch {}
        }
      } else {
        doc.setFont("helvetica", "italic"); doc.setTextColor(150, 150, 150)
        doc.text("Legal Guardian's Signature not required (Student is 18+)", margin, currentY + 10)
        doc.setTextColor(0, 0, 0); doc.setFont("helvetica", "normal")
      }
      
      currentY += 45
      doc.setFont("helvetica", "bold"); doc.text("APCC REPRESENTATIVE", margin, currentY); currentY += 10
      doc.setFont("helvetica", "normal")
      doc.text(`Name: ${adminData?.adminName || ""}`, margin, currentY)
      doc.text(`Title: ${adminData?.title || ""}`, margin + contentWidth / 2, currentY); currentY += 10
      doc.text(`Signature Date: ${new Date().toLocaleDateString()}`, margin, currentY)
      doc.text(`Catalog Date: ${adminData?.catalogDate || ""}`, margin + contentWidth / 2, currentY); currentY += 15
      
      doc.line(margin, currentY + 15, margin + 80, currentY + 15)
      doc.text("APCC Representative’s Signature", margin, currentY + 20)
      if (adminSignatureDataUrl) {
        try { doc.addImage(forcePngInkToBlack(adminSignatureDataUrl), "PNG", margin, currentY, 70, 15) } catch {}
      }
    } else {
      // Standard text rendering for other pages (Smarter title detection)
      const sections = content.split("\n\n")
      sections.forEach(section => {
        const trimmed = section.trim()
        if (!trimmed) return

        // Check if it's a section title (e.g., "Late Payments", "Default...", etc.)
        const lines = trimmed.split("\n")
        const firstLine = lines[0]
        
        // Pattern for titles: Short, bold-looking, and not the whole paragraph
        const isPotentialTitle = firstLine.length < 60 && lines.length > 1 && !firstLine.includes(".")
        
        if (isPotentialTitle) {
          doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(0, 0, 0)
          doc.text(firstLine, margin, currentY); currentY += 8
          
          const body = lines.slice(1).join("\n").trim()
          doc.setFont("helvetica", "normal"); doc.setFontSize(10.5)
          currentY = renderWrappedText(doc, body, margin, currentY, contentWidth) + 6
        } else {
          doc.setFont("helvetica", "normal"); doc.setFontSize(10)
          currentY = renderWrappedText(doc, trimmed, margin, currentY, contentWidth) + 6
        }
      })
    }

    drawFooter(doc, page.number, totalPages, signatureDataUrl)
  }

  return Buffer.from(doc.output("arraybuffer"))
}
