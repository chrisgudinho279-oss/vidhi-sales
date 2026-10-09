import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { inr, fmtDate } from '../utils';
import InvoiceTotals from '../components/InvoiceTotals';
import Loading from '../components/Loading';

export default function InvoiceDetails() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const [inv, setInv] = useState(null);
  const [co, setCo] = useState({});
  const [err, setErr] = useState('');

  useEffect(() => {
    Promise.all([api.get('/invoices/' + id), api.get('/settings')])
      .then(([i, s]) => { setInv(i); setCo(s); })
      .catch((e) => setErr(e.message));
  }, [id]);
  useEffect(() => { if (inv && params.get('print')) setTimeout(() => window.print(), 400); }, [inv]); // eslint-disable-line

  if (err) return <div className="alert error">{err}</div>;
  if (!inv) return <Loading />;
  const products = inv.items.filter((i) => i.item_type === 'product');
  const services = inv.items.filter((i) => i.item_type === 'service');

  const Rows = ({ list, title }) => list.length > 0 && (
    <>
      <tr className="section"><td colSpan="6">{title}</td></tr>
      {list.map((it, n) => (
        <tr key={it.id}>
          <td>{n + 1}</td><td>{it.name}</td><td className="r">{it.quantity}</td>
          <td className="r">{inr(it.price)}</td><td className="r">{it.gst_percent}%</td><td className="r">{inr(it.amount)}</td>
        </tr>
      ))}
    </>
  );

  return (
    <div>
      <div className="card-head no-print">
        <h2>Invoice {inv.invoice_no}</h2>
        <div className="row-gap">
          <button className="btn primary" onClick={() => window.print()}>🖨 Print</button>
          <Link className="btn" to={`/invoices/${inv.id}/edit`}>Edit</Link>
          <Link className="btn" to="/invoices">Back</Link>
        </div>
      </div>

      <div className="invoice-sheet">
        <div className="inv-head">
          {co.logo && <img src={co.logo} alt="logo" className="inv-logo" />}
          <div>
            <h1>{co.company_name || 'VIDHI SALES'}</h1>
            <p>{co.tagline}</p>
            <p>Phone: {co.phone}</p>
          </div>
        </div>
        <h2 className="inv-title">TAX INVOICE</h2>
        <div className="inv-meta">
          <div>
            <b>Bill To:</b><br />{inv.customer_name}<br />{inv.address}<br />
            {inv.phone && <>Phone: {inv.phone}<br /></>}{inv.email && <>Email: {inv.email}<br /></>}
            {inv.gstin && <>GSTIN: {inv.gstin}</>}
          </div>
          <div className="r">
            <b>Invoice No:</b> {inv.invoice_no}<br /><b>Date:</b> {fmtDate(inv.invoice_date)}<br />
            <b>Supply:</b> {inv.supply_type} ({inv.supply_type === 'Inter-State' ? 'IGST' : 'CGST + SGST'})<br />
            <b>Payment:</b> {inv.payment_method} • {inv.status}
          </div>
        </div>
        <table className="inv-table">
          <thead><tr><th>#</th><th>Description</th><th className="r">Qty</th><th className="r">Price</th><th className="r">GST</th><th className="r">Amount</th></tr></thead>
          <tbody><Rows list={products} title="Products" /><Rows list={services} title="Services" /></tbody>
        </table>
        <div className="inv-bottom">
          <div>{co.bank_details && (<><b>Bank Details</b><pre>{co.bank_details}</pre></>)}</div>
          <InvoiceTotals calc={inv} supplyType={inv.supply_type} discountPercent={inv.discount_percent} showProfit={false} />
        </div>
        <div className="inv-sign">{co.signature && <img src={co.signature} alt="signature" />}<p>Authorised Signatory</p></div>
        <div className="inv-footer">{co.footer_text || 'Right Product • Right Method • Right Training • Right Result'}</div>
      </div>
    </div>
  );
}
