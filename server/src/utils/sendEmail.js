import nodemailer from 'nodemailer';

let etherealTransporter = null;

export const getTransporter = async () => {
  // If SMTP environment variables are set (e.g. Mailtrap or custom SMTP)
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Otherwise, use / reuse cached Ethereal test account for fast and smooth testing
  if (!etherealTransporter) {
    const testAccount = await nodemailer.createTestAccount();
    etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return etherealTransporter;
};

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.FROM_EMAIL || '"ShopSphere" <noreply@shopsphere.com>',
    to,
    subject,
    text,
    html,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`[ShopSphere Nodemailer] Preview URL: ${previewUrl}`);
  }

  return info;
};

export default sendEmail;
