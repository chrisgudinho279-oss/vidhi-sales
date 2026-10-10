import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { Loading, refreshBranding } from '@/shared/ui';
import { isPhone, isStrongPassword, PHONE_MSG, PASSWORD_MSG } from '@/shared/lib';

export default function Settings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  useEffect(() => { api.get('/settings').then(setS).catch((e) => setMsg({ type: 'error', text: e.message })); }, []);
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    if (!(s.company_name || '').trim() || s.company_name.trim().length < 2) return setMsg({ type: 'error', text: 'Company name must be at least 2 characters' });
    if (!isPhone(s.phone || '')) return setMsg({ type: 'error', text: PHONE_MSG });
    try { setS(await api.put('/settings', s)); refreshBranding(); setMsg({ type: 'success', text: 'Settings saved' }); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  };
  const changePw = async (e) => {
    e.preventDefault();
    if (!pw.current_password) return setPwMsg({ type: 'error', text: 'Enter your current password' });
    if (!isStrongPassword(pw.new_password)) return setPwMsg({ type: 'error', text: PASSWORD_MSG });
    if (pw.new_password === pw.current_password) return setPwMsg({ type: 'error', text: 'New password must be different from the current password' });
    if (pw.new_password !== pw.confirm) return setPwMsg({ type: 'error', text: 'New passwords do not match' });
    try {
      await api.post('/auth/change-password', { current_password: pw.current_password, new_password: pw.new_password });
      setPw({ current_password: '', new_password: '', confirm: '' }); setPwMsg({ type: 'success', text: 'Password changed' });
    } catch (err) { setPwMsg({ type: 'error', text: err.message }); }
  };

  const [bk, setBk] = useState({ type: '', text: '' });
  const backup = async () => {
    try {
      const data = await api.get('/invoices/backup');
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = `vidhi-invoices-${new Date().toISOString().slice(0, 10)}.json`; a.click();
      URL.revokeObjectURL(url); setBk({ type: 'success', text: `Backup downloaded (${data.invoices.length} invoices)` });
    } catch (err) { setBk({ type: 'error', text: err.message }); }
  };
  const restore = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { const r = await api.post('/invoices/restore', JSON.parse(await f.text())); setBk({ type: 'success', text: r.message }); }
    catch (err) { setBk({ type: 'error', text: err instanceof SyntaxError ? 'File is not valid JSON' : err.message }); }
    e.target.value = '';
  };

  if (!s) return <Loading />;
  return (
    <div>
      <h2>Settings</h2>
      <form className="card form-grid" onSubmit={save}>
        <h3 className="wide">Company Details</h3>
        {msg.text && <div className={'alert wide ' + msg.type}>{msg.text}</div>}
        <label>Company Name<input value={s.company_name || ''} onChange={set('company_name')} /></label>
        <label>Phone<input maxLength={10} inputMode="numeric" value={s.phone || ''} onChange={(e) => setS({ ...s, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></label>
        <div className="wide"><button className="btn primary">Save Settings</button></div>
      </form>

      <details className="card settings-extra">
        <summary>Backup and restore data (advanced)</summary>
        {bk.text && <div className={'alert ' + bk.type}>{bk.text}</div>}
        <div className="row-gap">
          <button type="button" className="btn primary" onClick={backup}>⬇ Download Backup</button>
          <label className="btn">⬆ Restore from file<input type="file" accept=".json" hidden onChange={restore} /></label>
        </div>
      </details>

      <details className="settings-extra">
        <summary>Change account password</summary>
        <form className="card form-grid" onSubmit={changePw}>
          <h3 className="wide">Change Password</h3>
          {pwMsg.text && <div className={'alert wide ' + pwMsg.type}>{pwMsg.text}</div>}
          <label>Current Password<input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></label>
          <label>New Password<input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></label>
          <label>Confirm New Password<input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
          <div className="wide"><button className="btn primary">Change Password</button></div>
        </form>
      </details>
    </div>
  );
}
