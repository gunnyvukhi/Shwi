// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { useAuthStore } from '../../store/useAuthStore';

export default function Home() {
  // Lấy trạng thái đăng nhập từ kho chung Zustand
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>🚀 Chào mừng đến với Dự án Năm cuối!</h1>
        <p>Đây là trang chủ (Landing Page). Bất kỳ ai cũng có thể truy cập trang này.</p>
      </header>

      <main style={styles.main}>
        <div style={styles.card}>
          <h3>Bạn muốn đi đâu tiếp theo?</h3>
          
          {/* Render có điều kiện dựa vào trạng thái đăng nhập */}
          {isAuthenticated ? (
            <div>
              <p>Bạn đã đăng nhập rồi. Hãy tiếp tục công việc nhé!</p>
              <Link to={PATHS.DASHBOARD}>
                <button style={styles.buttonPrimary}>Vào Dashboard</button>
              </Link>
            </div>
          ) : (
            <div>
              <p>Bạn chưa đăng nhập. Vui lòng đăng nhập để trải nghiệm đầy đủ tính năng.</p>
              <Link to={PATHS.LOGIN}>
                <button style={styles.buttonPrimary}>Đi tới Đăng nhập</button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Một chút CSS inline cơ bản để trang web không bị trống trải
// Sau này bạn có thể thay thế bằng TailwindCSS, CSS Modules hoặc SCSS
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'sans-serif',
    backgroundColor: '#f5f5f5',
    color: '#333',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  main: {
    width: '100%',
    maxWidth: '500px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center' as const,
  },
  buttonPrimary: {
    marginTop: '1rem',
    padding: '10px 20px',
    fontSize: '16px',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
};