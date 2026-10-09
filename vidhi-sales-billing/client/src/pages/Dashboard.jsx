import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { inr, profitText } from '../utils';
import Loading from '../components/Loading';

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.get('/reports/summary').then(setS).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="alert error">{err}</div>;
  if (!s) return <Loading />;

  const cards = [
    ['Total Sales', inr(s.total_sales)], ['Total Invoices', s.total_invoices], ['Paid Amount', inr(s.paid)],
    ['Pending Amount', inr(s.pending)], ['Total Cost', inr(s.cost)],
    [s.profit < 0 ? 'Loss' : 'Profit', profitText(s.profit).replace(/^(Loss|Profit): /, ''), s.profit < 0 ? 'red' : 'green'],
    ['Total Products', s.total_products], ['Low Stock Products', s.low_stock_count, s.low_stock_count ? 'red' : ''],
  ];
  return (
    <div>
      <div className="card-head"><h2>Dashboard</h2><Link className="btn gold" to="/invoices/new">+ New Invoice</Link></div>
      <div className="stats">
        {cards.map(([label, value, tone]) => (
          <div key={label} className={'stat ' + (tone || '')}><span>{label}</span><strong>{value}</strong></div>
        ))}
      </div>
      <div className="card">
        <h3>⚠️ Low Stock Warnings</h3>
        {s.low_stock.length === 0 ? <p className="muted">All products have enough stock.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Product</th><th>Stock</th><th>Limit</th></tr></thead>
            <tbody>{s.low_stock.map((p) => (
              <tr key={p.id}><td>{p.name}</td><td><span className="badge red">{p.stock_quantity}</span></td><td>{p.low_stock_limit}</td></tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
