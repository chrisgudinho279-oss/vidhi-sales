import { useEffect, useState } from 'react';
import { api } from '@/shared/api';
import { Loading, refreshBranding } from '@/shared/ui';
import { isPhone, isStrongPassword, PHONE_MSG, PASSWORD_MSG } from '@/shared/lib';

export default function Settings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [mail, setMail] = useState({ business_email: '', connected: false, connected_email: '' });
  const [mailMsg, setMailMsg] = useState({ type: '', text: '' });
  const [mailBusy, setMailBusy] = useState(false);

  useEffect(() => { api.get('/settings').then(setS).catch((e) => setMsg({ type: 'error', text: e.message })); }, []);
  const refreshMailStatus = async () => {
    const status = await api.get('/email/google/status');
    setMail(status);
    return status;
  };
  useEffect(() => { refreshMailStatus().catch((e) => setMailMsg({ type: 'error', text: e.message })); }, []);
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
  const saveBusinessEmail = async (e) => {
    e.preventDefault();
    setMailBusy(true);
    try {
      const result = await api.put('/email/business-address', { business_email: mail.business_email });
      setMail((current) => ({ ...current, business_email: result.business_email }));
      setMailMsg({ type: 'success', text: 'Business email saved. Invoice copies will be sent here.' });
    } catch (err) { setMailMsg({ type: 'error', text: err.message }); }
    finally { setMailBusy(false); }
  };
  const connectGmail = async () => {
    const popup = window.open('about:blank', 'vidhi-gmail-oauth', 'popup,width=640,height=760');
    if (!popup) {
      setMailMsg({ type: 'error', text: 'Allow pop-ups for this app to connect Gmail.' });
      return;
    }
    setMailBusy(true);
    setMailMsg({ type: '', text: 'Opening Google sign-in. Approve Gmail sending access to finish connecting.' });
    let interval;
    const cleanup = () => {
      window.removeEventListener('message', onMessage);
      if (interval) window.clearInterval(interval);
    };
    const onMessage = async (event) => {
      if (event.source !== popup || !event.data || event.data.type !== 'gmail-oauth-complete') return;
      cleanup();
      setMailBusy(false);
      if (!event.data.ok) {
        setMailMsg({ type: 'error', text: event.data.message || 'Gmail connection was not completed.' });
        return;
      }
      try {
        await refreshMailStatus();
        setMailMsg({ type: 'success', text: event.data.message });
      } catch (err) { setMailMsg({ type: 'error', text: err.message }); }
    };
    window.addEventListener('message', onMessage);
    interval = window.setInterval(async () => {
      if (!popup.closed) return;
      cleanup();
      setMailBusy(false);
      try {
        const status = await refreshMailStatus();
        setMailMsg(status.connected
          ? { type: 'success', text: `Gmail connected as ${status.connected_email}.` }
          : { type: 'error', text: 'Gmail connection window was closed before authorization finished.' });
      } catch (err) { setMailMsg({ type: 'error', text: err.message }); }
    }, 700);
    try {
      const result = await api.post('/email/google/connect');
      popup.location.href = result.authorizationUrl;
    } catch (err) {
      cleanup();
      popup.close();
      setMailBusy(false);
      setMailMsg({ type: 'error', text: err.message });
    }
  };
  const disconnectGmail = async () => {
    setMailBusy(true);
    try {
      await api.post('/email/google/disconnect');
      await refreshMailStatus();
      setMailMsg({ type: 'success', text: 'Gmail disconnected.' });
    } catch (err) { setMailMsg({ type: 'error', text: err.message }); }
    finally { setMailBusy(false); }
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

      <form className="card form-grid" onSubmit={saveBusinessEmail}>
        <h3 className="wide">Email invoices</h3>
        <p className="wide">When you choose Print &amp; Email on an invoice, its PDF is sent to the customer and a copy goes to this address. Connect Gmail once; the app never asks for your Gmail password.</p>
        {mailMsg.text && <div className={'alert wide ' + mailMsg.type}>{mailMsg.text}</div>}
        <label>Send me a copy at<input type="email" required value={mail.business_email} onChange={(e) => setMail({ ...mail, business_email: e.target.value })} /></label>
        <div className="wide row-gap">
          <button className="btn primary" disabled={mailBusy}>Save Email</button>
          {mail.connected
            ? <><span>Gmail connected: {mail.connected_email}</span><button type="button" className="btn" onClick={disconnectGmail} disabled={mailBusy}>Disconnect Gmail</button></>
            : <button type="button" className="btn gold" onClick={connectGmail} disabled={mailBusy}>{mailBusy ? 'Connecting...' : 'Connect Gmail'}</button>}
        </div>
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
