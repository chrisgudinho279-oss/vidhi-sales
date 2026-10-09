// Editable rows for products (kind="product") or services (kind="service")
import { inr } from '../utils';

export default function ProductTable({ kind = 'product', rows, setRows, catalog }) {
  const isP = kind === 'product';
  const update = (i, patch) => setRows(rows.map((r, x) => (x === i ? { ...r, ...patch } : r)));
  const remove = (i) => setRows(rows.filter((_, x) => x !== i));
  const add = () => setRows([...rows, { ref_id: '', name: '', quantity: 1, price: '', cost: '', gst_percent: 18 }]);

  // when an item is selected, price / cost / GST are loaded automatically
  const pick = (i, id) => {
    const it = catalog.find((c) => String(c.id) === String(id));
    if (!it) return update(i, { ref_id: '', name: '', price: '', cost: '' });
    update(i, { ref_id: it.id, name: it.name, price: isP ? it.selling_price : it.price, cost: it.cost_price, gst_percent: it.gst_percent });
  };
  const stockOf = (r) => catalog.find((c) => String(c.id) === String(r.ref_id));

  return (
    <div className="card">
      <div className="card-head">
        <h3>{isP ? 'Products' : 'Services'}</h3>
        <button type="button" className="btn gold" onClick={add}>{isP ? '+ Add Product' : '+ Add Service'}</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: 220 }}>{isP ? 'Product' : 'Service'}</th><th>Qty</th><th>Selling Price</th>
              <th>Cost Price</th><th>GST %</th><th className="r">Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="7" className="muted center">No {isP ? 'products' : 'services'} added</td></tr>}
            {rows.map((r, i) => {
              const item = stockOf(r);
              const over = isP && item && Number(r.quantity) > item.stock_quantity;
              return (
                <tr key={i}>
                  <td>
                    <select value={r.ref_id} onChange={(e) => pick(i, e.target.value)}>
                      <option value="">-- Select --</option>
                      {catalog.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {isP && item && (
                      <small className={over ? 'text-red' : 'muted'}>Available stock: {item.stock_quantity}{over ? ' (not enough!)' : ''}</small>
                    )}
                  </td>
                  <td><input type="number" min="1" step="1" value={r.quantity} onChange={(e) => update(i, { quantity: e.target.value })} /></td>
                  <td><input type="number" min="0" step="0.01" value={r.price} onChange={(e) => update(i, { price: e.target.value })} /></td>
                  <td><input type="number" min="0" step="0.01" value={r.cost} onChange={(e) => update(i, { cost: e.target.value })} /></td>
                  <td><input type="number" min="0" step="0.01" value={r.gst_percent} onChange={(e) => update(i, { gst_percent: e.target.value })} /></td>
                  <td className="r">{inr(Number(r.quantity) * Number(r.price) || 0)}</td>
                  <td><button type="button" className="btn danger sm" onClick={() => remove(i)}>✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
