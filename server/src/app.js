const express = require('express');
const cors = require('cors');
const { auth } = require('./middleware/authMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.disable('x-powered-by');
app.use((req, res, next) => { // basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});
app.use(cors());
app.use(express.json({ limit: '5mb' })); // logo/signature are sent as base64

const { Setting } = require('./models');
app.get('/api/settings/public', async (req, res, next) => { // only name, tagline, logo
  try {
    const s = await Setting.findByPk(1);
    res.json({ company_name: (s && s.company_name) || 'VIDHI SALES', tagline: (s && s.tagline) || '', logo: (s && s.logo) || null });
  } catch (e) { next(e); }
});
app.use('/api/auth', require('./routes/authRoutes'));
// every route below needs a valid JWT
const emailController = require('./controllers/emailController');
app.get('/api/email/google/callback', emailController.callback);
app.use('/api/email', auth, require('./routes/emailRoutes'));
app.use('/api/products', auth, require('./routes/productRoutes'));
app.use('/api/services', auth, require('./routes/serviceRoutes'));
app.use('/api/customers', auth, require('./routes/customerRoutes'));
app.use('/api/invoices', auth, require('./routes/invoiceRoutes'));
app.use('/api/reports', auth, require('./routes/reportRoutes'));
app.use('/api/settings', auth, require('./routes/settingRoutes'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
