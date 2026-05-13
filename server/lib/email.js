const nodemailer = require('nodemailer');

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function sendEmail({ to, subject, text, html }) {
  if (!to) {
    throw new Error('Missing recipient address');
  }

  const from = process.env.EMAIL_FROM || 'no-reply@resetdopa.com';
  const transport = getTransport();

  if (!transport) {
    console.info('[email stub]', { to, subject, text });
    return {
      messageId: `stub-${Date.now()}`,
      accepted: [to],
    };
  }

  return transport.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendEmail,
};
