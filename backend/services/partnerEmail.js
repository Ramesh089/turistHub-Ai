const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || Number.isNaN(port) || !user || !pass || !from) {
    throw new Error('Partner email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM.');
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass }
  });
}

async function sendPartnerEmail({ to, subject, text, html }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    text,
    html
  });
}

function createPartnerAccountSetupUrl(token, baseUrl = process.env.CLIENT_URL || 'http://localhost:5173') {
  const url = new URL('/partner/activate', baseUrl);
  url.searchParams.set('token', token);
  return url.toString();
}

async function sendPartnerAccountSetupEmail(email, businessName, token) {
  const url = createPartnerAccountSetupUrl(token);
  await sendPartnerEmail({
    to: email,
    subject: 'Your TouristHub Business Partner application is approved',
    text: `Hello ${businessName}, your application is approved. Set your Business Partner password within 24 hours using this one-time link: ${url.toString()}`,
    html: `<p>Hello ${escapeHtml(businessName)},</p><p>Your Business Partner application is approved. Use this one-time link within 24 hours to set your password:</p><p><a href="${escapeHtml(url.toString())}">Set your password</a></p><p>If you did not request this, please ignore this email.</p>`
  });
}

async function sendPartnerTemporaryPasswordEmail(email, businessName, password) {
  await sendPartnerEmail({
    to: email,
    subject: 'Your TouristHub Business Partner temporary password',
    text: `Hello ${businessName}, your application is approved. Sign in with your registered email and this temporary password within 24 hours: ${password} . You must choose a new password at first sign-in. If you did not request this, please contact TouristHub support.`,
    html: `<p>Hello ${escapeHtml(businessName)},</p><p>Your application is approved. Sign in with your registered email and this temporary password within 24 hours:</p><p><strong>${escapeHtml(password)}</strong></p><p>You must choose a new password at first sign-in. If you did not request this, please contact TouristHub support.</p>`
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

module.exports = {
  sendPartnerAccountSetupEmail,
  sendPartnerTemporaryPasswordEmail
};
