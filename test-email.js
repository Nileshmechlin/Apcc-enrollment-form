const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmail() {
  console.log('Testing SMTP connection...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USERNAME,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'Test Email',
      text: 'This is a test email.',
    });
    console.log('Test email sent:', info.messageId);
  } catch (error) {
    console.error('Failed to send test email:', error);
  }
}

testEmail();
