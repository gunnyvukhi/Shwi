import { Navigate, Outlet } from 'react-router-dom';
import { PATHS } from './paths';
import { useAuthStore } from '../store/useAuthStore';

export const PublicRoute = () => {
  // Lấy trạng thái đăng nhập từ Zustand Store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    // Nếu ĐÃ đăng nhập mà cố tình vào trang Login/Register -> Đẩy về Dashboard
    return <Navigate to={PATHS.DASHBOARD} replace />;
  }

  // Nếu CHƯA đăng nhập -> Cho phép xem form Login/Register bình thường
  return <Outlet />;
};