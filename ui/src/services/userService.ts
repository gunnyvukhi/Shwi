
const API_BASE = `${import.meta.env.VITE_API_URL}/user`;

import type { User } from '../types/user';

export interface ActivityItem {
  time: string;
  cal: number;
}

export interface WeightItem {
  month: string;
  weight: number;
}

export interface BodyConditionItem {
  id?: number;
  userId?: string;
  weight: number;
  height?: number | null;
  bmi?: number | null;
  bodyFat?: number | null;
  muscleMass?: number | null;
  date?: string | null;
  loggedAt?: string | null;
  createdAt?: string | null;
}

export interface HeartRateItem {
  id?: number | null;
  bpm: number;
  recordedAt?: string | null;
  // Legacy compatibility
  userId?: string;
  restingBpm?: number | null;
  status?: string;
  timeLabel?: string;
}

export interface SleepItem {
  id?: number | null;
  durationDisplay?: string | null;
  durationMinutes?: number;
  sleepEfficiency?: number | null;
  sleepLatencyMinutes?: number | null;
  wasoMinutes?: number | null;
  deepSleepMinutes?: number | null;
  remSleepMinutes?: number | null;
  lightSleepMinutes?: number | null;
  timeLabel?: string | null;
  logCount?: number;
  // Legacy compatibility
  userId?: string;
  sleepQuality?: number;
}

export interface StepIntervalItem {
  timeLabel: string;
  steps: number;
  distanceKm: number;
  timeWalkedMinutes: number;
}

export interface StepSummary {
  date?: string;
  totalSteps: number;
  totalDistanceKm: number;
  totalWalkedMinutes: number;
  intervals: StepIntervalItem[];
}

export interface StepItem {
  id?: number;
  userId?: string;
  date?: string;
  timeLabel: string;
  steps: number;
  distanceKm?: number;
  timeWalkedMinutes?: number;
  // Legacy compatibility
  targetSteps?: number;
  caloriesBurned?: number;
  period?: string;
}

export interface WorkoutLogItem {
  id?: number;
  planId?: string | number | null;
  workoutName: string;
  durationMinutes: number;
  note?: string | null;
  createdAt?: string | null;
  // Legacy compatibility
  userId?: string;
  caloriesBurned?: number;
  muscleGroup?: string;
  intensity?: string;
}

export interface WorkoutPlanItem {
  id?: number;
  userId?: string;
  name: string;
  priority?: number;
  note?: string | null;
  createdAt?: string | null;
}

export interface MealItem {
  id?: number;
  userId?: string;
  mealName: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  timeEaten?: string;
  dateEaten?: string;
  createdAt?: string | null;
  // Legacy compatibility
  foodName?: string;
  mealType?: string;
}

export interface NutritionSummary {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
  meals: MealItem[];
}

export interface FullDashboardData {
  id?: string | number;
  profile: {
    id?: string | number;
    email: string;
    role: string;
    name: string;
    avatarUrl?: string | null;
    wallpaperUrl?: string | null;
    bio?: string | null;
    fitnessGoal?: number | null; // 0: lose, 1: gain
    targetWeight?: number | null;
    targetSteps?: number | null;
    gender?: number | null;
    phone?: string | null;
    age?: number | null;
  };
  metrics: {
    weight?: number | null;
    height?: number | null;
    bmi?: number | null;
    bodyFat?: number | null;
    muscleMass?: number | null;
    date?: string | null;
    loggedAt?: string | null;
    createdAt?: string | null;
  };
  heartRate: HeartRateItem;
  restingHeartRate: HeartRateItem;
  sleep: SleepItem;
  steps: StepSummary;
  workoutLogs: Record<string, { name: string; time: string }>;
  nutrition: NutritionSummary;
  weightHistory: WeightItem[];
  // Compatibility fields
  weightDataMonth?: WeightItem[];
}

export const userService = {

  async getMe(): Promise<User> {
    const token = localStorage.getItem('shwi_auth_token');
    const res = await fetch(`${API_BASE}/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    const data = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || 'Failed to authenticate token');
      err.status = res.status;
      throw err;
    }
    return data;
  },

  async getProfile(): Promise<User> {
    const token = localStorage.getItem('shwi_auth_token');
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

  async updateProfile(payload: Partial<User> & Record<string, any>): Promise<User> {
    const token = localStorage.getItem('shwi_auth_token');
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
    const token = localStorage.getItem('shwi_auth_token');
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

  /**
   * Gọi API 
   */

  async updateBodyCondition(payload: {
    weight?: number;
    height?: number;
    bodyFat?: number;
    muscleMass?: number;
    date?: string;
    targetWeight?: number;
  }): Promise<BodyConditionItem> {
    const token = localStorage.getItem('shwi_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/body-condition`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to log body condition');
    return data.bodyCondition;
  },

  async updateTarget(payload: {
    targetWeight?: number;
    targetSteps?: number;
    fitnessGoal?: number;
  }): Promise<string> {
    const token = localStorage.getItem('shwi_auth_token');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/profile/target`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update target');
    return data.message;
  }
};
