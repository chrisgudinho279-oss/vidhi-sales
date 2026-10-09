import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/shared/api';
import { calcInvoice, inr, profitText, today, validateInvoice } from '@/shared/lib';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from '@/shared/config';
import { InvoiceTotals, ProductTable, ServiceTable } from '@/features/invoice-editor';
import { Loading } from '@/shared/ui';

const blankRow = () => ({ ref_id: '', custom: false, name: '', quantity: 1, price: '', cost: '', gst_percent: 18 });
const toRows = (items, type) => items.filter((i) => i.item_type === type).map((i) => ({
  ref_id: (type === 'product' ? i.product_id : i.service_id) || '', custom: !(type === 'product' ? i.product_id : i.service_id), name: i.name, quantity: i.quantity, price: i.price, cost: i.cost, gst_percent: i.gst_percent,
}));
const toItems = (rows, type) => rows.filter((r) => r.ref_id || r.name).map((r) => ({
  item_type: type, [type === 'product' ? 'product_id' : 'service_id']: r.ref_id || null,
  name: r.name, quantity: r.quantity, price: r.price, cost: r.cost, gst_percent: r.gst_percent,
}));

export default function NewInvoice() {
  const { id } = useParams();          // present when editing
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    customer_id: '', customer_name: '', phone: '', email: '', address: '', gstin: '', supply_type: 'Intra-State',
    invoice_date: today(), status: 'Paid', payment_method: 'Cash', amount_paid: '', discount_percent: 0,
  });
  const [pRows, setPRows] = useState([]);
  const [sRows, setSRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const setError = (m) => setErrors(m ? [m] : []);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, s, c] = await Promise.all([api.get('/products'), api.get('/services'), api.get('/customers')]);
        setProducts(p); setServices(s); setCustomers(c);
        if (id) {
          const inv = await api.get('/invoices/' + id);
          setForm({ ...inv, invoice_date: String(inv.invoice_date).slice(0, 10), amount_paid: inv.status === 'Partially Paid' ? inv.amount_paid : '' });
          setPRows(toRows(inv.items, 'product')); setSRows(toRows(inv.items, 'service'));
        }
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, [id]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const calc = useMemo(() => calcInvoice([...pRows, ...sRows], form.discount_percent, form.status, form.amount_paid),
    [pRows, sRows, form.discount_percent, form.status, form.amount_paid]);

  // typing/choosing an existing customer name fills the other fields
  const onName = (e) => {
    const name = e.target.value;
    const c = customers.find((x) => x.name.toLowerCase() === name.toLowerCase());
    setForm(c ? { ...form, customer_id: c.id, customer_name: c.name, phone: c.phone || '', email: c.email || '', address: c.address || '', gstin: c.gstin || '', supply_type: c.supply_type }
      : { ...form, customer_id: '', customer_name: name });
  };

  const submit = async (e) => {
    e.preventDefault(); setError('');
    const errs = validateInvoice({ form, pRows, sRows, products, editing: !!id, calc });
    if (errs.length) { setErrors(errs); return window.scrollTo(0, 0); }
    setBusy(true);
    try {
      const payload = { ...form, items: [...toItems(pRows, 'product'), ...toItems(sRows, 'service')] };
      const saved = id ? await api.put('/invoices/' + id, payload) : await api.post('/invoices', payload);
      nav('/invoices/' + saved.id);
    } catch (err) { setError(err.message); window.scrollTo(0, 0); } finally { setBusy(false); }
  };

  if (loading) return <Loading />;
  return (
    <form onSubmit={submit} noValidate>
      <div className="card-head"><h2>{id ? `Edit Invoice ${form.invoice_no}` : 'New Invoice'}</h2></div>
      <div className="card invoice-guide">
        <strong>New to billing? Follow these steps</strong>
        <ol>
          <li>Enter the customer name.</li>
          <li>Add each product once and set its quantity.</li>
          <li>Check the total, choose payment status, then save.</li>
        </ol>
        <small className="muted">Fields marked optional can be left blank. Product prices load from your product list.</small>
      </div>
      {errors.length > 0 && (
        <div className="alert error">
          Please fix the following:
          <ul>{errors.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </div>
      )}

      <div className="card">
        <h3>Customer Details</h3>
        <div className="form-grid">
          <label>Customer Name *
            <input list="customers" maxLength={150} value={form.customer_name} onChange={onName} />
            <datalist id="customers">{customers.map((c) => <option key={c.id} value={c.name} />)}</datalist>
          </label>
          <label>Phone<input inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
          <label>Invoice Date<input type="date" required value={form.invoice_date} onChange={set('invoice_date')} /></label>
          <label>Payment Status
            <select value={form.status} onChange={set('status')}>{PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          <label>Payment Method
            <select value={form.payment_method} onChange={set('payment_method')}>{PAYMENT_METHODS.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
          {form.status === 'Partially Paid' && (
            <>
              <label>Amount Paid<input type="number" min="0" step="0.01" value={form.amount_paid} onChange={set('amount_paid')} /></label>
              <label>Balance Due<input readOnly value={calc.balance} /></label>
            </>
          )}
          <details className="wide optional-fields">
            <summary>More invoice details (optional)</summary>
            <div className="form-grid">
              <label>Email<input type="email" maxLength={120} value={form.email} onChange={set('email')} /></label>
              <label>GSTIN<input maxLength={15} placeholder="15 characters" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase().slice(0, 15) })} /></label>
              <label className="wide">Address<input maxLength={300} value={form.address || ''} onChange={set('address')} /></label>
              <label>Supply Type
                <select value={form.supply_type} onChange={set('supply_type')}><option>Intra-State</option><option>Inter-State</option></select>
              </label>
            </div>
          </details>
        </div>
      </div>

      <ProductTable rows={pRows} setRows={setPRows} catalog={products} />
      <details className="card optional-section">
        <summary>Add services (optional)</summary>
        <p className="muted small form-hint">Skip this section if you are only billing for products.</p>
        <ServiceTable rows={sRows} setRows={setSRows} catalog={services} />
      </details>

      <div className="card">
        <InvoiceTotals calc={calc} supplyType={form.supply_type} discountPercent={form.discount_percent} showProfit={false} />
        <details className="optional-fields discount-details">
          <summary>Show cost and profit (advanced)</summary>
          <p className="muted small">These business figures are not printed on the customer invoice.</p>
          <div className="totals business-totals">
            <div><span>Cost</span><b>{inr(calc.cost)}</b></div>
            <div className={calc.profit < 0 ? 'text-red' : 'text-green'}><span>Profit / Loss</span><b>{profitText(calc.profit)}</b></div>
          </div>
        </details>
        <details className="optional-fields discount-details">
          <summary>Add a discount (optional)</summary>
          <label className="discount-input">Discount %
            <input type="number" min="0" max="100" step="0.01" value={form.discount_percent} onChange={set('discount_percent')} />
          </label>
        </details>
      </div>
      <div className="row-gap">
        <button className="btn primary" disabled={busy}>{busy ? 'Saving...' : id ? 'Update Invoice' : 'Save Invoice'}</button>
        <button type="button" className="btn" onClick={() => nav('/invoices')}>Cancel</button>
      </div>
    </form>
  );
}
