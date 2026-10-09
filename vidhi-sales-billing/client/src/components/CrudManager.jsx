// Reusable list + add/edit form + delete (used for Products, Services and Customers)
import { useEffect, useState } from 'react';
import { api } from '../api';
import Loading from './Loading';

export default function CrudManager({ title, endpoint, fields, columns, blank }) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = () => api.get(endpoint).then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  useEffect(() => { setLoading(true); setForm(null); setErr(''); load(); }, [endpoint]);

  const save = async (e) => {
    e.preventDefault(); setErr('');
    for (const f of fields) if (f.required && !String(form[f.name] ?? '').trim()) return setErr(`${f.label} is required`);
    try {
      if (form.id) await api.put(`${endpoint}/${form.id}`, form); else await api.post(endpoint, form);
      setForm(null); load();
    } catch (e2) { setErr(e2.message); }
  };
  const del = async (r) => {
    if (!window.confirm(`Delete "${r.name}"?`)) return;
    try { await api.del(`${endpoint}/${r.id}`); load(); } catch (e2) { setErr(e2.message); }
  };
  const shown = rows.filter((r) => [r.name, r.phone, r.category, r.email].join(' ').toLowerCase().includes(q.toLowerCase()));

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
        <form className="card form-grid" onSubmit={save}>
          {fields.map((f) => (
            <label key={f.name} className={f.wide ? 'wide' : ''}>{f.label}{f.required && ' *'}
              {f.options ? (
                <select value={form[f.name] ?? ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                  {f.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type || 'text'} step={f.type === 'number' ? '0.01' : undefined} min={f.type === 'number' ? '0' : undefined}
                  value={form[f.name] ?? ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              )}
            </label>
          ))}
          <div className="wide row-gap">
            <button className="btn primary">{form.id ? 'Update' : 'Save'}</button>
            <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </form>
      )}
      {loading ? <Loading /> : (
        <div className="card table-wrap">
          <table>
            <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th>Actions</th></tr></thead>
            <tbody>
              {shown.length === 0 && <tr><td colSpan={columns.length + 1} className="muted center">No records found</td></tr>}
              {shown.map((r) => (
                <tr key={r.id}>
                  {columns.map((c) => <td key={c.label}>{c.render ? c.render(r) : r[c.key]}</td>)}
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
