import { useState } from 'react';
import { CrudManager } from '@/features/manage-records';
import { inr } from '@/shared/lib';

const minLen = (label) => (v) => (String(v || '').trim().length < 2 ? `${label} must be at least 2 characters` : '');
const price = (label) => (v) => (!(Number(v) > 0) ? `${label} must be greater than 0` : Number(v) > 100000000 ? `${label} is too large` : '');
const nonNeg = (label) => (v) => (v === '' || v == null || Number(v) >= 0 ? '' : `${label} cannot be negative`);
const gst = (v) => (v === '' || (Number(v) >= 0 && Number(v) <= 100) ? '' : 'GST % must be between 0 and 100');
const whole = (label) => (v) => (v === '' || v == null || (Number.isInteger(Number(v)) && Number(v) >= 0) ? '' : `${label} must be a whole number (0 or more)`);

const productFields = [
  { name: 'name', label: 'Product Name', required: true, wide: true, validate: minLen('Product name') },
  { name: 'selling_price', label: 'Selling Price (customer pays)', type: 'number', required: true, validate: price('Selling price') },
  { name: 'stock_quantity', label: 'Quantity in Stock', type: 'number', step: '1', validate: whole('Stock') },
  { name: 'category', label: 'Category', maxLength: 80, optional: true },
  { name: 'cost_price', label: 'Cost Price (your cost)', type: 'number', validate: nonNeg('Cost price'), optional: true },
  { name: 'gst_percent', label: 'GST %', type: 'number', validate: gst, optional: true },
  { name: 'low_stock_limit', label: 'Low Stock Alert At', type: 'number', step: '1', validate: whole('Low stock limit'), optional: true },
];
const productCols = [
  { label: 'Product', key: 'name' },
  { label: 'Selling Price', render: (r) => inr(r.selling_price) },
  { label: 'Stock', render: (r) => (
    <span className={'badge ' + (r.stock_quantity <= r.low_stock_limit ? 'red' : 'green')}>
      {r.stock_quantity}{r.stock_quantity <= r.low_stock_limit ? ' • LOW' : ''}
    </span>) },
  { label: 'Category', key: 'category', optional: true },
  { label: 'Cost Price', render: (r) => inr(r.cost_price), optional: true },
  { label: 'GST', render: (r) => r.gst_percent + '%', optional: true },
];
const serviceFields = [
  { name: 'name', label: 'Service Name', required: true, wide: true, validate: minLen('Service name') }, { name: 'price', label: 'Price', type: 'number', required: true, validate: price('Price') },
  { name: 'cost_price', label: 'Cost Price (your cost)', type: 'number', validate: nonNeg('Cost price'), optional: true },
  { name: 'gst_percent', label: 'GST %', type: 'number', validate: gst, optional: true },
];
const serviceCols = [
  { label: 'Service', key: 'name' }, { label: 'Price', render: (r) => inr(r.price) },
  { label: 'Cost', render: (r) => inr(r.cost_price), optional: true }, { label: 'GST', render: (r) => r.gst_percent + '%', optional: true },
];

export default function Products() {
  const [tab, setTab] = useState('products');
  return (
    <div>
      <div className="tabs">
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Products & Stock</button>
        <button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>Services</button>
      </div>
      {tab === 'products' ? (
        <CrudManager title="Products" endpoint="/products" fields={productFields} columns={productCols}
          formHint="Add the item name, the price your customer pays, and the quantity you have. Use Extra details only if needed."
          blank={{ name: '', category: 'General', selling_price: '', cost_price: 0, gst_percent: 18, stock_quantity: 0, low_stock_limit: 5 }} />
      ) : (
        <CrudManager title="Services" endpoint="/services" fields={serviceFields} columns={serviceCols}
          formHint="Add the service name and the price you charge. Cost and GST are optional details."
          blank={{ name: '', price: '', cost_price: 0, gst_percent: 18 }} />
      )}
    </div>
  );
}
