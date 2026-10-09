// Factory that creates the 4 CRUD handlers for a model (with trimming + duplicate checks)
const { asyncHandler, httpError } = require('../middleware/errorMiddleware');
const clean = (b) => {
  const d = {};
  for (const [k, val] of Object.entries(b || {})) {
    if (['id', 'createdAt', 'updatedAt'].includes(k)) continue;
    d[k] = typeof val === 'string' ? val.trim() : val;
  }
  return d;
};

module.exports = (Model, label, { order = [['name', 'ASC']], uniqueBy = [] } = {}) => {
  // e.g. two products cannot have the same name
  const checkUnique = async (data, id) => {
    for (const f of uniqueBy) {
      if (!data[f]) continue;
      const found = await Model.findOne({ where: { [f]: data[f] } });
      if (found && String(found.id) !== String(id)) throw httpError(400, `A ${label.toLowerCase()} with this ${f.replace(/_/g, ' ')} already exists`);
    }
  };
  return {
    list: asyncHandler(async (req, res) => res.json(await Model.findAll({ order }))),
    create: asyncHandler(async (req, res) => {
      const data = clean(req.body);
      await checkUnique(data, null);
      res.status(201).json(await Model.create(data));
    }),
    update: asyncHandler(async (req, res) => {
      const row = await Model.findByPk(req.params.id);
      if (!row) throw httpError(404, `${label} not found`);
      const data = clean(req.body);
      await checkUnique(data, row.id);
      await row.update(data);
      res.json(row);
    }),
    remove: asyncHandler(async (req, res) => {
      const row = await Model.findByPk(req.params.id);
      if (!row) throw httpError(404, `${label} not found`);
      await row.destroy();
      res.json({ message: `${label} deleted` });
    }),
  };
};
