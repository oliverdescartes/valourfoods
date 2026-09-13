require("dotenv").config();

const { transporter, sendEmail } = require("./emailService");

async function testEmail() {
  try {
    console.log("Checking SES SMTP connection...");

    await transporter.verify();

    console.log("SMTP connection successful!");

    const result = await sendEmail({
      to: process.env.TEST_EMAIL,
      subject: "VALOUR SES Test Email",
      text: "This is a test email from VALOUR Liquid Spice.",
      html: `
        <h2>Hello from VALOUR!</h2>
        <p>Your Amazon SES email integration is working.</p>
      `,
    });

    console.log("Email submitted successfully.");
    console.log("Message ID:", result.messageId);
  } catch (error) {
    console.error("Email test failed:", error.message);
  }
}

testEmail();
