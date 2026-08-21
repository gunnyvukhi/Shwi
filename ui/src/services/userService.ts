import type { User } from './authService';

const API_BASE = 'http://localhost:5000/api/user';

export const userService = {
  async getProfile(): Promise<User> {
    const token = localStorage.getItem('gym_auth_token');
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch user profile');
    }
    return data.user;
  },

  async updateProfile(payload: Partial<User>): Promise<User> {
    const token = localStorage.getItem('gym_auth_token');
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }
    return data.user;
  },

  async uploadMedia(file: File, type: 'avatar' | 'wallpaper'): Promise<{ url: string; user: User }> {
    const token = localStorage.getItem('gym_auth_token');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const res = await fetch(`${API_BASE}/upload-media`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to upload media');
    }
    return { url: data.url, user: data.user };
  }
};