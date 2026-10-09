// Small factory that creates the 4 CRUD handlers for a model
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');
const clean = (b) => { const d = { ...b }; ['id', 'createdAt', 'updatedAt'].forEach((k) => delete d[k]); return d; };

module.exports = (Model, label, order = [['name', 'ASC']]) => ({
  list: asyncHandler(async (req, res) => res.json(await Model.findAll({ order }))),                 // READ
  create: asyncHandler(async (req, res) => res.status(201).json(await Model.create(clean(req.body)))), // CREATE
  update: asyncHandler(async (req, res) => {                                                          // UPDATE
    const row = await Model.findByPk(req.params.id);
    if (!row) throw httpError(404, `${label} not found`);
    await row.update(clean(req.body));
    res.json(row);
  }),
  remove: asyncHandler(async (req, res) => {                                                          // DELETE
    const row = await Model.findByPk(req.params.id);
    if (!row) throw httpError(404, `${label} not found`);
    await row.destroy();
    res.json({ message: `${label} deleted` });
  }),
});
