const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { httpError } = require('../middleware/errorMiddleware');
const { checkEmail } = require('./validators');
const { createInvoicePdf } = require('./invoicePdf');

const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/gmail.send'];
const secret = () => process.env.JWT_SECRET || 'change_this_secret';

function oauthConfig() {
  const { GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REDIRECT_URI } = process.env;
  if (!GMAIL_OAUTH_CLIENT_ID || !GMAIL_OAUTH_CLIENT_SECRET || !GMAIL_OAUTH_REDIRECT_URI) {
    throw httpError(503, 'Gmail sending is not configured. Add the Gmail OAuth client ID, client secret and redirect URI to the server .env file.');
  }
  if (secret() === 'change_this_secret') {
    throw httpError(503, 'Set a private JWT_SECRET in the server .env file before connecting Gmail.');
  }
  return {
    clientId: GMAIL_OAUTH_CLIENT_ID,
    clientSecret: GMAIL_OAUTH_CLIENT_SECRET,
    redirectUri: GMAIL_OAUTH_REDIRECT_URI,
  };
}

function tokenKey() {
  if (secret() === 'change_this_secret') throw httpError(503, 'Set a private JWT_SECRET in the server .env file before connecting Gmail.');
  return crypto.scryptSync(secret(), 'vidhi-billing-gmail-oauth-token-v1', 32);
}

function encryptRefreshToken(token) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', tokenKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), encrypted.toString('base64')].join(':');
}

function decryptRefreshToken(value) {
  const [version, iv, tag, encrypted] = String(value || '').split(':');
  if (version !== 'v1' || !iv || !tag || !encrypted) throw httpError(503, 'Saved Gmail authorization is invalid. Disconnect and connect Gmail again.');
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', tokenKey(), Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    throw httpError(503, 'Saved Gmail authorization cannot be decrypted. Check JWT_SECRET, then reconnect Gmail.');
  }
}

function clientOrigin(value) {
  const input = value || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  let parsed;
  try { parsed = new URL(input); } catch { throw httpError(400, 'Client application origin is not a valid URL.'); }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if (!['http:', 'https:'].includes(parsed.protocol) || (!local && parsed.protocol !== 'https:') || parsed.origin !== input.replace(/\/$/, '')) {
    throw httpError(400, 'Client application origin must be an HTTPS origin (or local HTTP during development).');
  }
  return parsed.origin;
}

function authorizationUrl(userId, origin) {
  const config = oauthConfig();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: jwt.sign({ purpose: 'gmail-oauth', userId, clientOrigin: clientOrigin(origin) }, secret(), { expiresIn: '10m', algorithm: 'HS256' }),
  });
  return url.toString();
}

async function googleRequest(url, options, failureMessage) {
  let response;
  try {
    response = await fetch(url, options);
  } catch {
    throw httpError(502, 'Could not reach Google. Check the server internet connection and try again.');
  }
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    const details = data.error_description || (data.error && data.error.message) || data.error || failureMessage;
    throw httpError(502, `${failureMessage}: ${details}`);
  }
  return data;
}

async function exchangeAuthorizationCode(code) {
  const config = oauthConfig();
  const data = await googleRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  }, 'Google could not authorize Gmail');
  if (!data.access_token || !data.refresh_token) throw httpError(502, 'Google did not return Gmail authorization. Reconnect and approve the requested permissions.');
  const profile = await googleRequest('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` },
  }, 'Could not read the authorized Google account');
  if (!profile.email) throw httpError(502, 'Google did not return the authorized account email address.');
  return { email: profile.email, encryptedRefreshToken: encryptRefreshToken(data.refresh_token) };
}

async function accessToken(emailConfig) {
  if (!emailConfig || !emailConfig.refresh_token) throw httpError(503, 'Connect a Gmail account in Settings before sending invoices.');
  const config = oauthConfig();
  const refreshToken = decryptRefreshToken(emailConfig.refresh_token);
  const data = await googleRequest('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  }, 'Could not refresh Gmail authorization');
  if (!data.access_token) throw httpError(502, 'Google did not return an access token for Gmail.');
  return data.access_token;
}

function encodedHeader(value) {
  return `=?UTF-8?B?${Buffer.from(String(value || ''), 'utf8').toString('base64')}?=`;
}

async function sendInvoiceEmail(invoice, settings, emailConfig) {
  const businessEmail = (emailConfig && emailConfig.business_email) || process.env.BILLING_COPY_EMAIL;
  if (!businessEmail || !checkEmail(businessEmail)) throw httpError(503, 'Add a valid business email address in Settings before sending invoices.');
  if (!invoice.email || !checkEmail(invoice.email)) throw httpError(400, 'Add a valid customer email to this invoice before emailing it.');
  const token = await accessToken(emailConfig);
  const pdf = await createInvoicePdf(invoice, settings);
  const boundary = `vidhi_${crypto.randomBytes(18).toString('hex')}`;
  const company = settings && settings.company_name ? settings.company_name : 'VIDHI SALES';
  const filename = `${String(invoice.invoice_no || 'invoice').replace(/[^A-Za-z0-9._-]/g, '_')}.pdf`;
  const recipients = [`To: ${invoice.email}`];
  if (businessEmail.toLowerCase() !== invoice.email.toLowerCase()) recipients.push(`Bcc: ${businessEmail}`);
  const mime = [
    'MIME-Version: 1.0',
    ...recipients,
    `Subject: ${encodedHeader(`Invoice ${invoice.invoice_no} from ${company}`)}`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(`Hello ${invoice.customer_name || ''},\n\nPlease find invoice ${invoice.invoice_no} attached.\nTotal: INR ${Number(invoice.total || 0).toFixed(2)}\n\nRegards,\n${company}`, 'utf8').toString('base64'),
    `--${boundary}`,
    `Content-Type: application/pdf; name="${filename}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${filename}"`,
    '',
    pdf.toString('base64').match(/.{1,76}/g).join('\r\n'),
    `--${boundary}--`,
    '',
  ].join('\r\n');
  await googleRequest('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: Buffer.from(mime, 'utf8').toString('base64url') }),
  }, 'Gmail could not send the invoice');
  return { customerEmail: invoice.email, businessEmail };
}

function verifyState(state) {
  try {
    const payload = jwt.verify(state, secret(), { algorithms: ['HS256'] });
    if (payload.purpose !== 'gmail-oauth' || !payload.userId) throw new Error('Invalid state');
    payload.clientOrigin = clientOrigin(payload.clientOrigin);
    return payload;
  } catch {
    throw httpError(400, 'Gmail authorization expired or could not be verified. Start the connection again from Settings.');
  }
}

module.exports = {
  authorizationUrl,
  clientOrigin,
  exchangeAuthorizationCode,
  encryptRefreshToken,
  sendInvoiceEmail,
  verifyState,
};
