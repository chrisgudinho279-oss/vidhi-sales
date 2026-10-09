import Logo from '@/shared/ui/Logo';

export default function Header({ toggle }) {
  return (
    <header className="topbar no-print">
      <button className="menu-btn" onClick={toggle} aria-label="Menu">☰</button>
      <Logo size={38} />
      <div className="topbar-title">
        <strong>VIDHI SALES</strong>
        <span>Housekeeping & Professional Cleaning Solutions</span>
      </div>
      <div className="topbar-user">👤 {sessionStorage.getItem('username') || 'admin'}</div>
    </header>
  );
}
