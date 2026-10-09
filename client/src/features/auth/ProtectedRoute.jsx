import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '@/shared/api';

// the JWT contains an expiry time (exp); expired tokens are removed
function tokenValid() {
  const t = getToken();
  if (!t) return false;
  try {
    const payload = JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp * 1000 > Date.now()) return true;
  } catch { /* invalid token */ }
  sessionStorage.clear();
  return false;
}

// Shows the page only when a valid JWT exists, otherwise redirects to login
export default function ProtectedRoute() {
  return tokenValid() ? <Outlet /> : <Navigate to="/login" replace />;
}
