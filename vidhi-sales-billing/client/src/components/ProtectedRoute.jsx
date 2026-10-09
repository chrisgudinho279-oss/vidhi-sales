import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '../api';

// Shows the page only when a JWT exists, otherwise redirects to login
export default function ProtectedRoute() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}
