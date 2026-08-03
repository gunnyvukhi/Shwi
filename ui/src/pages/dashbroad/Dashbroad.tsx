import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { PATHS } from '../../routes/paths';
import { BasicBackground } from '../../components/layout/BasicBackground';

export default function Dashboard() {
  // Lấy dữ liệu user và hàm logout từ store
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Xóa data trong Zustand -> isAuthenticated về false
    navigate(PATHS.LOGIN); // Chuyển về trang login
  };

  return (
    <BasicBackground>
      <h2>Chào mừng đến với Dashboard, {user?.name}!</h2>
      <p>Email của bạn: {user?.email}</p>
      <button onClick={handleLogout}>Đăng xuất</button>
    </BasicBackground>
  );
}