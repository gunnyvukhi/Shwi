
const API_BASE = `${import.meta.env.VITE_API_URL}/auth`;

import type { AuthResponse } from '../types/auth';

export const authService = {
  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to register account');
    }
    return data;
  },

  async verifyEmailOtp(email: string, otp: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/verify-email-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid OTP verification code');
    }
    return data;
  },

  async resendOtp(email: string, purpose: string = 'email_verification'): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purpose }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to resend OTP code');
    }
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      const errObj: any = new Error(data.error || 'Invalid email or password');
      if (data.requireVerification) {
        errObj.requireVerification = true;
        errObj.email = data.email || email;
      }
      throw errObj;
    }
    return data;
  },

  async forgotPassword(email: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to request password reset');
    }
    return data;
  },

  async resetPasswordOtp(email: string, otp: string, newPassword: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/reset-password-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  },

  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  },

  async googleLogin(payload: { googleId?: string; email?: string; name?: string; avatarUrl?: string; idToken?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Google login failed');
    }
    return data;
  },

  async appleLogin(payload: { appleId?: string; email?: string; name?: string; identityToken?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Apple login failed');
    }
    return data;
  },
};