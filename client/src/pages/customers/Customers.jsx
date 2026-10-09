import { CrudManager } from '@/features/manage-records';
import { isPhone, isEmail, isGstin, PHONE_MSG, EMAIL_MSG, GSTIN_MSG } from '@/shared/lib';

const fields = [
  { name: 'name', label: 'Customer Name', required: true, maxLength: 150, validate: (v) => (String(v || '').trim().length < 2 ? 'Customer name must be at least 2 characters' : '') },
  { name: 'phone', label: 'Phone', digits: 10, validate: (v) => (isPhone(v) ? '' : PHONE_MSG) },
  { name: 'email', label: 'Email', type: 'email', maxLength: 120, validate: (v) => (isEmail(v) ? '' : EMAIL_MSG), optional: true },
  { name: 'gstin', label: 'GSTIN', upper: true, maxLength: 15, validate: (v) => (isGstin(v) ? '' : GSTIN_MSG), optional: true },
  { name: 'address', label: 'Address', wide: true, maxLength: 300, optional: true },
  { name: 'supply_type', label: 'Supply Type', options: ['Intra-State', 'Inter-State'], optional: true },
];
const columns = [
  { label: 'Name', key: 'name' }, { label: 'Phone', key: 'phone' }, { label: 'Email', key: 'email', optional: true },
  { label: 'GSTIN', key: 'gstin', optional: true }, { label: 'Supply', key: 'supply_type', optional: true },
];

export default function Customers() {
  return <CrudManager title="Customers" endpoint="/customers" fields={fields} columns={columns}
    formHint="Start with the customer's name and phone. Add tax and contact details only when you have them."
    blank={{ name: '', phone: '', email: '', address: '', gstin: '', supply_type: 'Intra-State' }} />;
}
