import { NavLink, useNavigate } from 'react-router-dom';

const links = [
  ['/', '📊 Dashboard'], ['/invoices/new', '🧾 New Invoice'], ['/invoices', '📁 Invoice History'],
  ['/products', '📦 Products'], ['/customers', '👥 Customers'], ['/reports', '📈 Reports'], ['/settings', '⚙️ Settings'],
];

export default function Sidebar({ open, close }) {
  const nav = useNavigate();
  const logout = () => { sessionStorage.clear(); nav('/login'); };
  return (
    <aside className={'sidebar no-print' + (open ? ' open' : '')}>
      <div className="brand">VIDHI <span>SALES</span></div>
      <nav>
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end onClick={close} className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
        ))}
      </nav>
      <button className="logout" onClick={logout}>🚪 Logout</button>
    </aside>
  );
}
