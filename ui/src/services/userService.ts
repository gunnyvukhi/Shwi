import type { User } from './authService';

const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/user` : 'http://localhost:5000/api/user';

export interface ActivityItem {
  time: string;
  cal: number;
}

export interface WeightItem {
  month: string;
  weight: number;
}

export interface DashboardData {
  activityDataDay: ActivityItem[];
  activityDataWeek: ActivityItem[];
  activityDataMonth: ActivityItem[];
  weightDataMonth: WeightItem[];
}

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
  },

  async getDashboardData(): Promise<DashboardData> {
    const token = localStorage.getItem('gym_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/dashboard`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch dashboard data');
    }
    return data;
  }
};