import { Navigate, Outlet } from 'react-router-dom';
import { PATHS } from './paths';
import { useAuthStore } from '../store/useAuthStore';

export const PublicRoute = () => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to={PATHS.DASHBOARD} replace />;
  }

  return <Outlet />;
};