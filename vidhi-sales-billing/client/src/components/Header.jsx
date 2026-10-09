export default function Header({ toggle }) {
  return (
    <header className="topbar no-print">
      <button className="menu-btn" onClick={toggle} aria-label="Menu">☰</button>
      <div className="topbar-title">
        <strong>VIDHI SALES</strong>
        <span>Housekeeping & Professional Cleaning Solutions</span>
      </div>
      <div className="topbar-user">👤 {sessionStorage.getItem('username') || 'admin'}</div>
    </header>
  );
}
