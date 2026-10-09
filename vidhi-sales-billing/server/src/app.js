const express = require('express');
const cors = require('cors');
const { auth } = require('./middleware/authMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // logo/signature are sent as base64

app.use('/api/auth', require('./routes/authRoutes'));
// every route below needs a valid JWT
app.use('/api/products', auth, require('./routes/productRoutes'));
app.use('/api/services', auth, require('./routes/serviceRoutes'));
app.use('/api/customers', auth, require('./routes/customerRoutes'));
app.use('/api/invoices', auth, require('./routes/invoiceRoutes'));
app.use('/api/reports', auth, require('./routes/reportRoutes'));
app.use('/api/settings', auth, require('./routes/settingRoutes'));

app.use(notFound);
app.use(errorHandler);
module.exports = app;
