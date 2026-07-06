import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Gate for authenticated admin routes. `superAdminOnly` restricts to SUPER_ADMIN.
export function ProtectedRoute({ superAdminOnly = false }: { superAdminOnly?: boolean }) {
  const { isAuthenticated, isSuperAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/spots" replace />;
  return <Outlet />;
}
