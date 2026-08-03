// src/store/useAuthStore.ts
import { create } from 'zustand';

// 1. Định nghĩa kiểu dữ liệu cho User (tùy thuộc vào backend của bạn)
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// 2. Định nghĩa kiểu dữ liệu cho toàn bộ Kho (State + Actions)
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
}

// 3. Khởi tạo Zustand Store với kiểu AuthState
export const useAuthStore = create<AuthState>((set) => ({
  // Trạng thái ban đầu (State)
  user: null,
  isAuthenticated: false,

  // Hàm xử lý hành động (Actions)
  login: (userData) => set({ 
    user: userData, 
    isAuthenticated: true 
  }),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false 
  }),
}));