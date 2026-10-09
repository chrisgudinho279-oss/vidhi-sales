// Editable rows for products (kind="product") or services (kind="service")
// - an item can be chosen only once (already used items are disabled in other rows)
// - "Custom" lets the user type an item that is not in the catalogue
import { useState } from 'react';
import { inr } from '@/shared/lib';

export default function ProductTable({ kind = 'product', rows, setRows, catalog }) {
  const isP = kind === 'product';
  const [showExtraFields, setShowExtraFields] = useState(false);
  const update = (i, patch) => setRows(rows.map((r, x) => (x === i ? { ...r, ...patch } : r)));
  const remove = (i) => setRows(rows.filter((_, x) => x !== i));
  const add = () => setRows([...rows, { ref_id: '', custom: false, name: '', quantity: 1, price: '', cost: '', gst_percent: 18 }]);

  const usedIds = rows.map((r) => String(r.ref_id)).filter(Boolean);
  const customNames = rows.filter((r) => r.custom && r.name.trim()).map((r) => r.name.trim().toLowerCase());
  const selectValue = (r) => (r.custom ? 'custom' : String(r.ref_id || ''));

  // when an item is selected, price / cost / GST are loaded automatically
  const pick = (i, val) => {
    if (val === 'custom') return update(i, { custom: true, ref_id: '', name: '', price: '', cost: '', gst_percent: 18 });
    const it = catalog.find((c) => String(c.id) === String(val));
    if (!it) return update(i, { custom: false, ref_id: '', name: '', price: '', cost: '' });
    update(i, { custom: false, ref_id: it.id, name: it.name, price: isP ? it.selling_price : it.price, cost: it.cost_price, gst_percent: it.gst_percent });
  };
  const stockOf = (r) => catalog.find((c) => String(c.id) === String(r.ref_id));

  return (
    <div className="card">
      <div className="card-head">
        <h3>{isP ? 'Products' : 'Services'}</h3>
        <button type="button" className="btn gold" onClick={add}>{isP ? '+ Add Product' : '+ Add Service'}</button>
      </div>
      <p className="muted small form-hint">Choose each item once. If you need more of it, change the quantity. Selling price fills in automatically.</p>
      <div className="extra-fields-toggle">
        <button type="button" className="btn sm" onClick={() => setShowExtraFields(!showExtraFields)}>
          {showExtraFields ? 'Hide cost and GST fields' : 'Show cost and GST fields'}
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ minWidth: 230 }}>{isP ? 'Product' : 'Service'}</th><th>Qty</th><th>Selling Price</th>
              {showExtraFields && <><th>Cost Price (your cost)</th><th>GST %</th></>}
              <th className="r">Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={showExtraFields ? 7 : 5} className="muted center">No {isP ? 'products' : 'services'} yet. Select “Add {isP ? 'Product' : 'Service'}” to get started.</td></tr>}
            {rows.map((r, i) => {
              const item = stockOf(r);
              const over = isP && item && Number(r.quantity) > item.stock_quantity;
              const dupCustom = r.custom && r.name.trim() && customNames.filter((n) => n === r.name.trim().toLowerCase()).length > 1;
              return (
                <tr key={i} className={dupCustom ? 'row-error' : ''}>
                  <td>
                    <select value={selectValue(r)} onChange={(e) => pick(i, e.target.value)}>
                      <option value="">-- Select --</option>
                      <option value="custom">✏️ Custom (type your own)</option>
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id} disabled={usedIds.includes(String(c.id)) && String(r.ref_id) !== String(c.id)}>
                          {c.name}{usedIds.includes(String(c.id)) && String(r.ref_id) !== String(c.id) ? ' (already added)' : ''}
                        </option>
                      ))}
                    </select>
                    {r.custom && (
                      <input className="mt" placeholder={`Custom ${isP ? 'product' : 'service'} name`} maxLength={200}
                        value={r.name} onChange={(e) => update(i, { name: e.target.value })} />
                    )}
                    {r.custom && <small className="muted">Custom item{isP ? ' – stock is not tracked' : ''}</small>}
                    {dupCustom && <small className="text-red">Same name added twice</small>}
                    {isP && item && (
                      <small className={over ? 'text-red' : 'muted'}>Available stock: {item.stock_quantity}{over ? ' (not enough!)' : ''}</small>
                    )}
                  </td>
                  <td><input type="number" min="1" max="100000" step="1" value={r.quantity} onChange={(e) => update(i, { quantity: e.target.value })} /></td>
                  <td><input type="number" min="0.01" max="10000000" step="0.01" value={r.price} onChange={(e) => update(i, { price: e.target.value })} /></td>
                  {showExtraFields && <>
                    <td><input type="number" min="0" max="10000000" step="0.01" value={r.cost} onChange={(e) => update(i, { cost: e.target.value })} /></td>
                    <td><input type="number" min="0" max="100" step="0.01" value={r.gst_percent} onChange={(e) => update(i, { gst_percent: e.target.value })} /></td>
                  </>}
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
