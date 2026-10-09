import CrudManager from '../components/CrudManager';

const fields = [
  { name: 'name', label: 'Customer Name', required: true }, { name: 'phone', label: 'Phone' },
  { name: 'email', label: 'Email', type: 'email' }, { name: 'gstin', label: 'GSTIN' },
  { name: 'address', label: 'Address', wide: true }, { name: 'supply_type', label: 'Supply Type', options: ['Intra-State', 'Inter-State'] },
];
const columns = [
  { label: 'Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Email', key: 'email' },
  { label: 'GSTIN', key: 'gstin' }, { label: 'Supply', key: 'supply_type' },
];

export default function Customers() {
  return <CrudManager title="Customers" endpoint="/customers" fields={fields} columns={columns}
    blank={{ name: '', phone: '', email: '', address: '', gstin: '', supply_type: 'Intra-State' }} />;
}
