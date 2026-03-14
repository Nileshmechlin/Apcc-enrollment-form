import nodemailer from "nodemailer"

/**
 * Sends an email with the signed PDF attached.
 *
 * Uses Gmail SMTP credentials from environment variables.
 * Sends to both the student and admin.
 */
export async function sendSignedAgreementEmail({
  studentEmail,
  studentName,
  adminEmail,
  adminName,
  adminNotes,
  pdfBuffer,
      dateOfBirth,
      parentsName,
}: {
  studentEmail: string
  studentName: string
  adminEmail: string
  adminName: string
  adminNotes?: string
  pdfBuffer: Buffer
  dateOfBirth?: string
  parentsName?: string
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false, // use STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  })

  const fromName = process.env.FROM_NAME || "Student Agreement Form"
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USERNAME
  const fromAddress = `"${fromName}" <${fromEmail}>`

  const filename = `agreement-${studentName.replace(/\s+/g, "-").toLowerCase()}.pdf`

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 22px;">✅ Student Agreement Approved</h1>
      </div>
      <div style="background: #f9f9ff; padding: 24px; border: 1px solid #e5e5f0; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #333; font-size: 15px;">Hello,</p>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          The student agreement has been reviewed and approved by the admin. The signed PDF is attached to this email.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 12px; background: #f0edf8; font-weight: bold; color: #5838a3; border-radius: 6px 0 0 0;">Student Name</td>
            <td style="padding: 8px 12px; background: #f5f3fa; border-radius: 0 6px 0 0;">${studentName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 12px; background: #f0edf8; font-weight: bold; color: #5838a3;">Email</td>
            <td style="padding: 8px 12px; background: #f5f3fa;">${studentEmail}</td>
          </tr>
          ${
            dateOfBirth
              ? `
          <tr>
            <td style="padding: 8px 12px; background: #f0edf8; font-weight: bold; color: #5838a3;">Date of Birth</td>
            <td style="padding: 8px 12px; background: #f5f3fa;">${dateOfBirth}</td>
          </tr>`
              : ""
          }
          ${
            parentsName
              ? `
          <tr>
            <td style="padding: 8px 12px; background: #f0edf8; font-weight: bold; color: #5838a3;">Parent's Name</td>
            <td style="padding: 8px 12px; background: #f5f3fa;">${parentsName}</td>
          </tr>`
              : ""
          }
          <tr>
            <td style="padding: 8px 12px; background: #f0edf8; font-weight: bold; color: #5838a3;">Approved by</td>
            <td style="padding: 8px 12px; background: #f5f3fa;">${adminName}</td>
          </tr>
          ${
            adminNotes
              ? `
          <tr>
            <td style="padding: 8px 12px; background: #f0edf8; font-weight: bold; color: #5838a3; border-radius: 0 0 0 6px;">Admin Notes</td>
            <td style="padding: 8px 12px; background: #f5f3fa; border-radius: 0 0 6px 0;">${adminNotes}</td>
          </tr>`
              : ""
          }
        </table>
        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          The signed agreement PDF is attached to this email for your records.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e5f0; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is an automated email from the Student Agreement Form system.
        </p>
      </div>
    </div>
  `

  // Send to student
  await transporter.sendMail({
    from: fromAddress,
    to: studentEmail,
    subject: `Your Agreement Has Been Approved — ${studentName}`,
    html: htmlBody,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  })

  // Send to admin
  await transporter.sendMail({
    from: fromAddress,
    to: adminEmail,
    subject: `[Approved] Agreement — ${studentName}`,
    html: htmlBody,
    attachments: [
      {
        filename,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  })
}
