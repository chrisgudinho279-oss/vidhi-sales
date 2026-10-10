const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const API_BASE = `${apiOrigin}/api`;
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Cheque'];
export const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partially Paid'];
