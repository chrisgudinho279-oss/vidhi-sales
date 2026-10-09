const router = require('express').Router();
const { Setting } = require('../models');
const { asyncHandler } = require('../middleware/errorMiddleware');
const getRow = async () => (await Setting.findByPk(1)) || Setting.create({ id: 1 });
router.get('/', asyncHandler(async (req, res) => res.json(await getRow())));
router.put('/', asyncHandler(async (req, res) => {
  const row = await getRow();
  const { id, ...data } = req.body;
  await row.update(data);
  res.json(row);
}));
module.exports = router;
