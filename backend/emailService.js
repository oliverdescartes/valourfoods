require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail({ to, subject, text, html }) {
  if (!to || !subject || (!text && !html)) {
    throw new Error("Recipient, subject, and email content are required");
  }

  return transporter.sendMail({
    from: `"VALOUR Liquid Spice" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    text,
    html,
  });
}

module.exports = { transporter, sendEmail };
