// Reusable list + add/edit form + delete (used for Products, Services and Customers)
import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { Loading } from '@/shared/ui';

export default function CrudManager({ title, endpoint, fields, columns, blank, formHint }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [showExtraColumns, setShowExtraColumns] = useState(false);

  const load = () => api.get(endpoint).then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  useEffect(() => { setLoading(true); setForm(null); setErr(''); load(); }, [endpoint]);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    for (const f of fields) {
      const val = form[f.name];
      if (f.required && !String(val ?? '').trim()) return setErr(`${f.label} is required`);
      const msg = f.validate && f.validate(val, form);   // field-specific rule
      if (msg) return setErr(msg);
    }
    try {
      if (form.id) await api.put(`${endpoint}/${form.id}`, form); else await api.post(endpoint, form);
      setForm(null); load();
    } catch (e2) { setErr(e2.message); }
  };
  const del = async (r) => {
    if (!window.confirm(`Delete "${r.name}"?`)) return;
    try { await api.del(`${endpoint}/${r.id}`); load(); } catch (e2) { setErr(e2.message); }
  };
  const change = (f, val) => {
    if (f.digits) val = val.replace(/\D/g, '').slice(0, f.digits);
    if (f.upper) val = val.toUpperCase();
    setForm({ ...form, [f.name]: val });
  };
  const shown = rows.filter((r) => [r.name, r.phone, r.category, r.email].join(' ').toLowerCase().includes(q.toLowerCase()));
  const visibleColumns = columns.filter((c) => !c.optional || showExtraColumns);

  return (
    <div>
      <div className="card-head">
        <h2>{title}</h2>
        <div className="row-gap">
          <input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn gold" onClick={() => setForm({ ...blank })}>+ Add</button>
        </div>
      </div>
      {err && <div className="alert error">{err}</div>}
      {form && (
        <form className="card form-grid" onSubmit={save} noValidate>
          {formHint && <p className="wide muted form-hint">{formHint}</p>}
          {fields.filter((f) => !f.optional).map((f) => (
            <label key={f.name} className={f.wide ? 'wide' : ''}>{f.label}{f.required && ' *'}
              {f.options ? (
                <select value={form[f.name] ?? ''} onChange={(e) => change(f, e.target.value)}>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} step={f.type === 'number' ? (f.step || '0.01') : undefined} min={f.type === 'number' ? '0' : undefined}
                  maxLength={f.maxLength || 200} inputMode={f.digits ? 'numeric' : undefined}
                  value={form[f.name] ?? ''} onChange={(e) => change(f, e.target.value)} />
              )}
            </label>
          ))}
          {fields.some((f) => f.optional) && (
            <details className="wide optional-fields">
              <summary>Extra details (optional)</summary>
              <div className="form-grid">
                {fields.filter((f) => f.optional).map((f) => (
                  <label key={f.name} className={f.wide ? 'wide' : ''}>{f.label}{f.required && ' *'}
                    {f.options ? (
                      <select value={form[f.name] ?? ''} onChange={(e) => change(f, e.target.value)}>
                        {f.options.map((o) => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={f.type || 'text'} step={f.type === 'number' ? (f.step || '0.01') : undefined} min={f.type === 'number' ? '0' : undefined}
                        maxLength={f.maxLength || 200} inputMode={f.digits ? 'numeric' : undefined}
                        value={form[f.name] ?? ''} onChange={(e) => change(f, e.target.value)} />
                    )}
                  </label>
                ))}
              </div>
            </details>
          )}
          <div className="wide row-gap">
            <button type="submit" className="btn primary">{form.id ? 'Save changes' : 'Save'}</button>
            <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {loading ? <Loading /> : (
        <div className="card table-wrap">
          {columns.some((c) => c.optional) && (
            <div className="card-head">
              <span className="muted small">Showing essential information</span>
              <button type="button" className="btn sm" onClick={() => setShowExtraColumns(!showExtraColumns)}>
                {showExtraColumns ? 'Hide extra columns' : 'Show extra columns'}
              </button>
            </div>
          )}
          <table>
            <thead><tr>{visibleColumns.map((c) => <th key={c.label}>{c.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={visibleColumns.length + 1} className="muted center">No records found</td></tr>}
              {shown.map((r) => (
                <tr key={r.id}>
                  {visibleColumns.map((c) => <td key={c.label}>{c.render ? c.render(r) : r[c.key]}</td>)}
                  <td className="nowrap">
                    <button className="btn sm" onClick={() => setForm({ ...r })}>Edit</button>{' '}
                    <button className="btn danger sm" onClick={() => del(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
