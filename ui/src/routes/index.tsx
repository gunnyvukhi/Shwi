import { createBrowserRouter } from 'react-router-dom';
import { PATHS } from './paths';

import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute'; // 1. Import PublicRoute

import Home from '../pages/home/Home';
import Login from '../pages/login/Login';
import Dashboard from '../pages/dashbroad/Dashbroad';
import ForgotPassword from '../pages/forgotpassword/ForgotPassword';
import Register from '../pages/register/Register';

export const router = createBrowserRouter([
  // Nhóm 1: Các trang ai cũng vào được (Landing page, Giới thiệu,...)
  // Không bọc gì cả
  {
    path: PATHS.HOME,
    element: <Home />,
  },

  // Nhóm 2: Các trang Public (Chỉ dành cho người CHƯA đăng nhập)
  {
    element: <PublicRoute />, // Bọc PublicRoute ở đây
    children: [
      {
        path: PATHS.LOGIN,
        element: <Login />,
      },
      {
        path: PATHS.REGISTER,
        element: <Register />,
      },
      {
        path: PATHS.FORGOTPASSWORD,
        element: <ForgotPassword />,
      },
    ],
  },

  // Nhóm 3: Các trang Protected (Chỉ dành cho người ĐÃ đăng nhập)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: PATHS.DASHBOARD,
        element: <Dashboard />,
      },
    ],
  },

  // Nhóm 4: Bắt lỗi 404
  {
    path: PATHS.NOT_FOUND,
    element: <div>404 - Không tìm thấy trang!</div>,
  },
]);