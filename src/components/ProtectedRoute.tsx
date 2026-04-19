import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  const token = localStorage.getItem('docmosiss_token');

  // If there is no token, kick them back to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If they have a token, let them through to the child routes
  return <Outlet />;
}