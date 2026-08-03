export const PATHS = {
  HOME: '/',
  LOGIN: '/login',
  FORGOTPASSWORD: '/forgotpassword',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  NOT_FOUND: '*',
} as const; // Dùng 'as const' để TS hiểu đây là các giá trị cố định, hỗ trợ gợi ý code 