import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { inr, fmtDate } from '../utils';
import Loading from '../components/Loading';

const tone = { Paid: 'green', Pending: 'red', 'Partially Paid': 'gold' };

export default function InvoiceHistory() {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [f, setF] = useState({ q: '', status: '', from: '', to: '' });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = () => {
    const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
    setLoading(true);
    api.get('/invoices?' + qs).then(setRows).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, [f.status, f.from, f.to]); // eslint-disable-line

  const del = async (r) => {
    if (!window.confirm(`Delete invoice ${r.invoice_no}? Stock will be restored.`)) return;
    try { await api.del('/invoices/' + r.id); load(); } catch (e) { setErr(e.message); }
  };

  return (
    <div>
      <div className="card-head"><h2>Invoice History</h2><Link className="btn gold" to="/invoices/new">+ New Invoice</Link></div>
      {err && <div className="alert error">{err}</div>}
      <form className="card filters" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <input placeholder="Search invoice no, customer, phone" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} />
        <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">All status</option><option>Paid</option><option>Pending</option><option>Partially Paid</option>
        </select>
        <input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} title="From date" />
        <input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} title="To date" />
        <button className="btn primary">Search</button>
      </form>
      {loading ? <Loading /> : (
        <div className="card table-wrap">
          <table>
            <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Phone</th><th>Status</th><th className="r">Total</th>
              <th className="r">Paid</th><th className="r">Balance</th><th className="r">Profit/Loss</th><th>Method</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan="11" className="muted center">No invoices found</td></tr>}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><Link to={'/invoices/' + r.id}><b>{r.invoice_no}</b></Link></td>
                  <td>{fmtDate(r.invoice_date)}</td><td>{r.customer_name}</td><td>{r.phone}</td>
                  <td><span className={'badge ' + tone[r.status]}>{r.status}</span></td>
                  <td className="r">{inr(r.total)}</td><td className="r">{inr(r.amount_paid)}</td><td className="r">{inr(r.balance)}</td>
                  <td className={'r ' + (r.profit < 0 ? 'text-red' : 'text-green')}>{r.profit < 0 ? '-' : ''}{inr(Math.abs(r.profit))}</td>
                  <td>{r.payment_method}</td>
                  <td className="nowrap">
                    <button className="btn sm" onClick={() => nav('/invoices/' + r.id)}>View</button>{' '}
                    <button className="btn sm" onClick={() => nav('/invoices/' + r.id + '?print=1')}>Print</button>{' '}
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
