import { google } from "googleapis"

/**
 * Appends a row of form data to the configured Google Sheet.
 *
 * The Google Sheet should have headers matching the keys in formData,
 * plus a 'Timestamp' and 'Signed' column.
 *
 * Required env vars:
 * - GOOGLE_SERVICE_ACCOUNT_EMAIL
 * - GOOGLE_PRIVATE_KEY
 * - GOOGLE_SHEET_ID
 */
export async function appendToSheet(formData: Record<string, string>) {
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  const sheetId = process.env.GOOGLE_SHEET_ID

  if (!serviceAccountEmail || !privateKey || !sheetId) {
    console.warn(
      "[Google Sheets] Missing credentials — skipping sheet append. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, and GOOGLE_SHEET_ID in .env.local",
    )
    return
  }

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const sheets = google.sheets({ version: "v4", auth })

  // Ensure headers exist in row 1
  const headers = [
    "Student ID",
    "Full Name",
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Date of Birth",
    "Parent's Name",
    "Date",
    "Signed",
    "Timestamp",
  ]

  try {
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:L1",
    })

    const existingHeaders = headerCheck.data.values?.[0]
    if (!existingHeaders || existingHeaders.length === 0) {
      // No headers yet — insert them
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: "Sheet1!A1:L1",
        valueInputOption: "USER_ENTERED",
        requestBody: {
          values: [headers],
        },
      })
    }
  } catch {
    // If reading fails (empty sheet), write headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: "Sheet1!A1:L1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [headers],
      },
    })
  }

  // Use Arizona (America/Phoenix) timezone — MST year-round, no DST
  const timestamp = new Date().toLocaleString("en-US", {
    timeZone: "America/Phoenix",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })

  // Split full name
  const fullName = formData.fullName || ""
  const nameParts = fullName.trim().split(/\s+/)
  const firstName = nameParts[0] || ""
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : ""

  // Build the data row
  const row = [
    formData.studentId || "",
    fullName,
    firstName,
    lastName,
    formData.email || "",
    formData.phone || "",
    formData.dateOfBirth || "",
    formData.parentsName || "",
    formData.date || "",
    "Yes",
    timestamp,
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:L",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row],
    },
  })
}
