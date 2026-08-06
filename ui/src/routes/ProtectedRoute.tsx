import { Navigate, Outlet } from 'react-router-dom';
import { PATHS } from './paths';
import { useAuthStore } from '../store/useAuthStore';

export const ProtectedRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing && !isAuthenticated) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  return <Outlet />;
};