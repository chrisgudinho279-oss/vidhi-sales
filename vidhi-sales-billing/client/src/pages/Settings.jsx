import { useEffect, useState } from 'react';
import { api } from '../api';
import Loading from '../components/Loading';

const readFile = (file) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });

export default function Settings() {
  const [s, setS] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });

  useEffect(() => { api.get('/settings').then(setS).catch((e) => setMsg({ type: 'error', text: e.message })); }, []);
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const pickImage = (k) => async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 1024 * 1024) return setMsg({ type: 'error', text: 'Image must be smaller than 1 MB' });
    setS({ ...s, [k]: await readFile(f) });
  };

  const save = async (e) => {
    e.preventDefault();
    try { setS(await api.put('/settings', s)); setMsg({ type: 'success', text: 'Settings saved' }); }
    catch (err) { setMsg({ type: 'error', text: err.message }); }
  };
  const changePw = async (e) => {
    e.preventDefault();
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
        <label>Phone<input value={s.phone || ''} onChange={set('phone')} /></label>
        <label className="wide">Tagline<input value={s.tagline || ''} onChange={set('tagline')} /></label>
        <label className="wide">Footer Text<input value={s.footer_text || ''} onChange={set('footer_text')} /></label>
        <label className="wide">Bank Details<textarea rows="3" value={s.bank_details || ''} onChange={set('bank_details')} /></label>
        <label>Logo<input type="file" accept="image/*" onChange={pickImage('logo')} />{s.logo && <img className="thumb" src={s.logo} alt="logo" />}</label>
        <label>Signature<input type="file" accept="image/*" onChange={pickImage('signature')} />{s.signature && <img className="thumb" src={s.signature} alt="signature" />}</label>
        <div className="wide"><button className="btn primary">Save Settings</button></div>
      </form>

      <div className="card">
        <h3>Backup & Restore Invoices</h3>
        {bk.text && <div className={'alert ' + bk.type}>{bk.text}</div>}
        <div className="row-gap">
          <button type="button" className="btn primary" onClick={backup}>⬇ Download Backup</button>
          <label className="btn">⬆ Restore from file<input type="file" accept=".json" hidden onChange={restore} /></label>
        </div>
      </div>

      <form className="card form-grid" onSubmit={changePw}>
        <h3 className="wide">Change Password</h3>
        {pwMsg.text && <div className={'alert wide ' + pwMsg.type}>{pwMsg.text}</div>}
        <label>Current Password<input type="password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></label>
        <label>New Password<input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></label>
        <label>Confirm New Password<input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></label>
        <div className="wide"><button className="btn primary">Change Password</button></div>
      </form>
    </div>
  );
}
