import nodemailer from 'nodemailer';

/**
 * Lazily-initialised singleton Nodemailer transporter based on environment variables.
 */
let cachedTransport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter {
  if (cachedTransport) return cachedTransport;

  const { EMAIL_SMTP_USER, EMAIL_SMTP_PASS } = process.env;
  if (!EMAIL_SMTP_USER || !EMAIL_SMTP_PASS) {
    throw new Error('EMAIL_SMTP_USER and EMAIL_SMTP_PASS must be set');
  }

  cachedTransport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // use STARTTLS
    auth: {
      user: EMAIL_SMTP_USER,
      pass: EMAIL_SMTP_PASS,
    },
  });

  return cachedTransport;
}

/**
 * Send a plain-text email notifying of a new user sign-up.
 */
export async function sendSignupNotification(params: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const { email, name } = params;
  const transporter = getTransport();

  const textLines = ['New user signed up!', `Email: ${email}`];
  if (name) textLines.push(`Name: ${name}`);
  textLines.push(`Timestamp: ${new Date().toISOString()}`);

  await transporter.sendMail({
    from: process.env.EMAIL_SMTP_USER,
    to: process.env.NOTIFICATIONS_EMAIL_TO,
    subject: `New user signup: ${email}`,
    text: textLines.join('\n'),
  });
}

/**
 * Send the daily usage report.
 * @param reportText Pre-formatted plain-text body (e.g., table of usage lines).
 */
export async function sendDailyUsageReport(reportText: string): Promise<void> {
  const transporter = getTransport();

  await transporter.sendMail({
    from: process.env.EMAIL_SMTP_USER,
    to: process.env.NOTIFICATIONS_EMAIL_TO,
    subject: `AI Calendar Helper – Daily usage report – ${new Date().toLocaleDateString('en-CA')}`,
    text: reportText,
  });
}
