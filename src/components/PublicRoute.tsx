import { Navigate, Outlet } from 'react-router-dom';

export default function PublicRoute() {
  const token = localStorage.getItem('docmosiss_token');

  // If they already have a token, kick them straight to the workspace
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  // If no token, let them access the Login or Signup pages normally
  return <Outlet />;
}