import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { inr, profitText } from '@/shared/lib';
import { Loading } from '@/shared/ui';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function Reports() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState('');
  const [sum, setSum] = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    setErr('');
    Promise.all([api.get(`/reports/summary?year=${year}&month=${month}`), api.get('/reports/monthly?year=' + year)])
      .then(([s, m]) => { setSum(s); setMonthly(m); }).catch((e) => setErr(e.message));
  }, [year, month]);

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const cards = sum && [
    ['Total Sales', inr(sum.total_sales)], ['Total Invoices', sum.total_invoices], ['Total Paid', inr(sum.paid)],
    ['Total Pending', inr(sum.pending)], ['Total Cost', inr(sum.cost)], ['Profit / Loss', profitText(sum.profit), sum.profit < 0 ? 'red' : 'green'],
  ];
  return (
    <div>
      <div className="card-head">
        <h2>Sales & Profit Reports</h2>
        <div className="row-gap">
          <select value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => <option key={y}>{y}</option>)}</select>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">All months</option>{MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>
      {err && <div className="alert error">{err}</div>}
      {!sum || !monthly ? <Loading /> : (
        <>
          <div className="stats">{cards.map(([l, v, t]) => <div key={l} className={'stat ' + (t || '')}><span>{l}</span><strong>{v}</strong></div>)}</div>
          <div className="card table-wrap">
            <h3>Monthly Report – {monthly.year}</h3>
            <table>
              <thead><tr><th>Month</th><th className="r">Invoices</th><th className="r">Sales</th><th className="r">Cost</th><th className="r">Profit/Loss</th></tr></thead>
              <tbody>{monthly.months.map((m) => (
                <tr key={m.month}>
                  <td>{MONTHS[m.month - 1]}</td><td className="r">{m.invoices}</td><td className="r">{inr(m.sales)}</td><td className="r">{inr(m.cost)}</td>
                  <td className={'r ' + (m.profit < 0 ? 'text-red' : 'text-green')}>{profitText(m.profit)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
