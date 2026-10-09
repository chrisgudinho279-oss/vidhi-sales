import { useEffect, useState } from 'react';

let cache = null; // remember the logo so it is fetched only once
export const refreshBranding = () => { cache = null; window.dispatchEvent(new Event('branding')); };

export function useBranding() {
  const [b, setB] = useState(cache);
  useEffect(() => {
    const load = () => fetch('/api/settings/public').then((r) => r.json()).then((d) => { cache = d; setB(d); }).catch(() => {});
    if (!cache) load();
    window.addEventListener('branding', load);
    return () => window.removeEventListener('branding', load);
  }, []);
  return b;
}

// Shows the company logo (uploaded in Settings) if there is one
export default function Logo({ size = 44 }) {
  const b = useBranding();
  // uses the logo uploaded in Settings, otherwise the default company logo (public/logo.png)
  return <img src={(b && b.logo) || '/logo.png'} alt="VIDHI SALES logo" className="app-logo" style={{ height: size }} />;
}
