const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log(`[email skipped - no SMTP configured] To: ${to} | Subject: ${subject}`);
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
};

module.exports = sendEmail;
