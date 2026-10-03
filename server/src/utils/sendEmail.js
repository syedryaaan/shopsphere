import nodemailer from 'nodemailer';

let etherealTransporter = null;

export const isRealEmailConfigured = () => {
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  const isPlaceholder = emailPass.includes('PASTE_YOUR') || emailPass === '';
  return Boolean(emailUser && emailPass && !isPlaceholder);
};

export const getTransporter = async () => {
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  let emailPass = (process.env.EMAIL_PASS || process.env.SMTP_PASS || '').trim();
  emailPass = emailPass.replace(/\s+/g, '');

  // 1. Custom SMTP host (e.g. Mailtrap or custom SMTP)
  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST.trim(),
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // 2. Real Gmail service if credentials provided
  if (isRealEmailConfigured()) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // 3. Fallback to Ethereal test account for automated testing
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
  const emailUser = (process.env.EMAIL_USER || process.env.SMTP_USER || '').trim();
  const fromAddress =
    process.env.MAIL_FROM ||
    (emailUser ? `"ShopSphere Admin" <${emailUser}>` : '"ShopSphere Admin" <noreply@shopsphere.dev>');

  const transporter = await getTransporter();

  const mailOptions = {
    from: fromAddress,
    to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info);

  if (previewUrl) {
    console.log(`[ShopSphere Nodemailer] Ethereal Preview URL: ${previewUrl}`);
  }

  return {
    success: true,
    info,
    previewUrl,
    messageId: info.messageId,
  };
};

export default sendEmail;
