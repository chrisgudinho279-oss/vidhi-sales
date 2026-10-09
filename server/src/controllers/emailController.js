const { EmailConfig, User, Setting } = require('../models');
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');
const { checkEmail } = require('../utils/validators');
const { authorizationUrl, exchangeAuthorizationCode, verifyState } = require('../utils/gmailOAuth');

const getConfig = () => EmailConfig.findByPk(1);

exports.status = asyncHandler(async (req, res) => {
  const config = await getConfig();
  res.json({
    connected: Boolean(config && config.refresh_token),
    connected_email: (config && config.connected_email) || '',
    business_email: (config && config.business_email) || process.env.BILLING_COPY_EMAIL || '',
  });
});

exports.saveBusinessEmail = asyncHandler(async (req, res) => {
  const email = String(req.body.business_email || '').trim();
  if (!checkEmail(email) || !email) throw httpError(400, 'Enter a valid business email address.');
  const [config] = await EmailConfig.findOrCreate({
    where: { id: 1 },
    defaults: { business_email: process.env.BILLING_COPY_EMAIL || '' },
  });
  await config.update({ business_email: email });
  res.json({ business_email: config.business_email });
});

exports.connect = asyncHandler(async (req, res) => {
  res.json({ authorizationUrl: authorizationUrl(req.user.id, req.get('origin')) });
});

function oauthResult(res, ok, message, origin) {
  const payload = JSON.stringify({ type: 'gmail-oauth-complete', ok, message }).replace(/</g, '\\u003c');
  const safeMessage = String(message).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Gmail connection</title></head><body><p>${safeMessage}</p><p>You can close this window.</p><script>if(window.opener)window.opener.postMessage(${payload},${JSON.stringify(origin)});window.close();</script></body></html>`);
}

exports.callback = async (req, res, next) => {
  let callbackOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  try {
    if (!req.query.state) throw httpError(400, 'Gmail authorization could not be verified. Start the connection again from Settings.');
    const oauthState = verifyState(req.query.state);
    callbackOrigin = oauthState.clientOrigin;
    if (req.query.error) return oauthResult(res, false, 'Gmail access was not granted. You can try connecting again from Settings.', callbackOrigin);
    if (!req.query.code) throw httpError(400, 'Google did not return an authorization code. Start the connection again from Settings.');
    const user = await User.findByPk(oauthState.userId);
    if (!user) throw httpError(401, 'The app account that started Gmail authorization no longer exists.');
    const account = await exchangeAuthorizationCode(req.query.code);
    const [config] = await EmailConfig.findOrCreate({
      where: { id: 1 },
      defaults: { business_email: process.env.BILLING_COPY_EMAIL || '' },
    });
    await config.update({
      connected_email: account.email,
      refresh_token: account.encryptedRefreshToken,
    });
    return oauthResult(res, true, `Gmail connected as ${account.email}.`, callbackOrigin);
  } catch (error) {
    if (error.status) return oauthResult(res, false, error.message, callbackOrigin);
    return next(error);
  }
};

exports.disconnect = asyncHandler(async (req, res) => {
  const config = await getConfig();
  if (config) await config.update({ connected_email: null, refresh_token: null });
  res.json({ message: 'Gmail disconnected.' });
});
