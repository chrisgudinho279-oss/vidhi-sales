const router = require('express').Router();
const { Setting } = require('../models');
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');
const { checkPhone, PHONE_MSG } = require('../utils/validators');
const getRow = async () => (await Setting.findByPk(1)) || Setting.create({ id: 1 });
const FIELDS = ['company_name', 'tagline', 'phone', 'logo', 'signature', 'bank_details', 'footer_text'];

router.get('/', asyncHandler(async (req, res) => res.json(await getRow())));
router.put('/', asyncHandler(async (req, res) => {
  const d = {};
  FIELDS.forEach((k) => { if (req.body[k] !== undefined) d[k] = typeof req.body[k] === 'string' && k !== 'logo' && k !== 'signature' ? req.body[k].trim() : req.body[k]; });
  if (!d.company_name || d.company_name.length < 2 || d.company_name.length > 150) throw httpError(400, 'Company name must be 2-150 characters');
  if (!checkPhone(d.phone || '')) throw httpError(400, PHONE_MSG);
  if ((d.tagline || '').length > 200) throw httpError(400, 'Tagline is too long (max 200)');
  if ((d.footer_text || '').length > 250) throw httpError(400, 'Footer text is too long (max 250)');
  if ((d.bank_details || '').length > 1000) throw httpError(400, 'Bank details are too long (max 1000)');
  for (const k of ['logo', 'signature']) {
    if (d[k] && !/^data:image\/(png|jpe?g|gif|webp);base64,/.test(d[k])) throw httpError(400, `${k} must be a PNG, JPG, GIF or WEBP image`);
  }
  const row = await getRow();
  await row.update(d);
  res.json(row);
}));
module.exports = router;
