import { Navigate, Outlet } from 'react-router-dom';
import { PATHS } from './paths';
import { useAuthStore } from '../store/useAuthStore'; // 1. Import hook của Zustand

export const ProtectedRoute = () => {
  // 2. Lấy chính xác trạng thái isAuthenticated từ kho chung
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    // Nếu chưa đăng nhập, đá về trang Login
    return <Navigate to={PATHS.LOGIN} replace />;
  }

  // Nếu đã đăng nhập, cho phép truy cập các trang con bên trong (ví dụ: Dashboard)
  return <Outlet />;
};