import type { User } from './authService';

const API_BASE = `${import.meta.env.VITE_API_URL}/user`;

export interface ActivityItem {
  time: string;
  cal: number;
}

export interface WeightItem {
  month: string;
  weight: number;
}

export interface BodyConditionItem {
  id: number;
  userId: string;
  weight: number;
  height?: number | null;
  bmi?: number | null;
  bodyFat?: number | null;
  muscleMass?: number | null;
  date?: string;
  loggedAt?: string;
  createdAt?: string;
}

export interface HeartRateItem {
  id: number;
  userId: string;
  bpm: number;
  restingBpm?: number | null;
  status?: string;
  timeLabel?: string;
  recordedAt?: string;
}

export interface SleepItem {
  id: number;
  userId: string;
  durationMinutes: number;
  durationDisplay: string;
  sleepQuality?: number;
  deepSleepMinutes?: number;
  remSleepMinutes?: number;
  lightSleepMinutes?: number;
  timeLabel?: string;
}

export interface StepItem {
  id: number;
  userId: string;
  steps: number;
  targetSteps: number;
  distanceKm?: number;
  caloriesBurned?: number;
  period: string;
  timeLabel: string;
}

export interface WorkoutItem {
  id: number;
  userId: string;
  workoutName: string;
  durationMinutes: number;
  caloriesBurned: number;
  muscleGroup?: string;
  intensity?: string;
  notes?: string;
  createdAt?: string;
}

export interface FoodIntakeItem {
  id: number;
  userId: string;
  mealType: string;
  foodName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  createdAt?: string;
}

export interface DashboardData {
  activityDataDay: ActivityItem[];
  activityDataWeek: ActivityItem[];
  activityDataMonth: ActivityItem[];
  weightDataMonth: WeightItem[];
  bodyConditionLogs?: BodyConditionItem[];
  heartRateLogs?: HeartRateItem[];
  sleepLogs?: SleepItem[];
  stepLogs?: StepItem[];
  workoutLogs?: WorkoutItem[];
  foodIntakeLogs?: FoodIntakeItem[];
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
  },

  async getHeartRateLogs(): Promise<HeartRateItem[]> {
    const token = localStorage.getItem('gym_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/heart-rate`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch heart rate logs');
    }
    return data.heartRateLogs || [];
  },

  async addHeartRateLog(payload: { bpm: number; restingBpm?: number; status?: string; timeLabel?: string }): Promise<HeartRateItem> {
    const token = localStorage.getItem('gym_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/heart-rate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to log heart rate');
    }
    return data.log;
  },

  async getBodyConditionLogs(): Promise<BodyConditionItem[]> {
    const token = localStorage.getItem('gym_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/body-condition`, {
      method: 'GET',
      headers,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch body condition logs');
    }
    return data.bodyConditionLogs || [];
  },

  async addBodyConditionLog(payload: {
    weight: number;
    height?: number;
    bodyFat?: number;
    muscleMass?: number;
    date?: string;
  }): Promise<BodyConditionItem> {
    const token = localStorage.getItem('gym_auth_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/body-condition`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to log body condition');
    }
    return data.log;
  },

  async deleteBodyConditionLog(logId: number): Promise<void> {
    const token = localStorage.getItem('gym_auth_token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/body-condition/${logId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to delete body condition log');
    }
  }
};