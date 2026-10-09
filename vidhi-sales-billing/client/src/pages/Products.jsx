import { useState } from 'react';
import CrudManager from '../components/CrudManager';
import { inr } from '../utils';

const productFields = [
  { name: 'name', label: 'Product Name', required: true, wide: true }, { name: 'category', label: 'Category' },
  { name: 'selling_price', label: 'Selling Price', type: 'number', required: true }, { name: 'cost_price', label: 'Cost Price', type: 'number' },
  { name: 'gst_percent', label: 'GST %', type: 'number' }, { name: 'stock_quantity', label: 'Stock Quantity', type: 'number' },
  { name: 'low_stock_limit', label: 'Low Stock Limit', type: 'number' },
];
const productCols = [
  { label: 'Product', key: 'name' }, { label: 'Category', key: 'category' },
  { label: 'Selling', render: (r) => inr(r.selling_price) }, { label: 'Cost', render: (r) => inr(r.cost_price) },
  { label: 'GST', render: (r) => r.gst_percent + '%' },
  { label: 'Stock', render: (r) => (
    <span className={'badge ' + (r.stock_quantity <= r.low_stock_limit ? 'red' : 'green')}>
      {r.stock_quantity}{r.stock_quantity <= r.low_stock_limit ? ' • LOW' : ''}
    </span>) },
];
const serviceFields = [
  { name: 'name', label: 'Service Name', required: true, wide: true }, { name: 'price', label: 'Price', type: 'number', required: true },
  { name: 'cost_price', label: 'Cost Price', type: 'number' }, { name: 'gst_percent', label: 'GST %', type: 'number' },
];
const serviceCols = [
  { label: 'Service', key: 'name' }, { label: 'Price', render: (r) => inr(r.price) },
  { label: 'Cost', render: (r) => inr(r.cost_price) }, { label: 'GST', render: (r) => r.gst_percent + '%' },
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
          blank={{ name: '', category: 'General', selling_price: '', cost_price: 0, gst_percent: 18, stock_quantity: 0, low_stock_limit: 5 }} />
      ) : (
        <CrudManager title="Services" endpoint="/services" fields={serviceFields} columns={serviceCols}
          blank={{ name: '', price: '', cost_price: 0, gst_percent: 18 }} />
      )}
    </div>
  );
}
