import { useState } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Footer, Header, Sidebar } from '@/widgets/shell';
import { ProtectedRoute } from '@/features/auth';
import Login from '@/pages/login';
import Dashboard from '@/pages/dashboard';
import NewInvoice from '@/pages/invoice-editor';
import InvoiceHistory from '@/pages/invoice-history';
import InvoiceDetails from '@/pages/invoice-details';
import Products from '@/pages/products';
import Customers from '@/pages/customers';
import Reports from '@/pages/reports';
import Settings from '@/pages/settings';

function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app">
      <Sidebar open={open} close={() => setOpen(false)} />
      <div className="main">
        <Header toggle={() => setOpen(!open)} />
        <div className="content"><Outlet /></div>
        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/invoices/new" element={<NewInvoice />} />
          <Route path="/invoices/:id/edit" element={<NewInvoice />} />
          <Route path="/invoices/:id" element={<InvoiceDetails />} />
          <Route path="/invoices" element={<InvoiceHistory />} />
          <Route path="/products" element={<Products />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
