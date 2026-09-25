export interface User {
    id: string;
    metrics: {
        bmi: number | null;
        bodyFat: number | null;
        createdAt: string | null;
        date: string | null;
        height: number | null;
        loggedAt: string | null;
        muscleMass: number | null;
        weight: number | null;
    };
    nutrition: {
        calories: number;
        carbs: number;
        date: string;
        fat: number;
        mealCount: number;
        meals: any[];
        protein: number;
    };
    profile: {
        age: number | null;
        avatarUrl: string | null;
        bio: string | null;
        email: string;
        fitnessGoal: number | null;
        gender: number | null;
        name: string;
        phone: string | null;
        role: string;
        targetSteps: number | null;
        targetWeight: number | null;
        wallpaperUrl: string | null;
    };
    sleep: {
        id: number | null,
        durationDisplay: string,
        sleepEfficiency: number,
        sleepLatencyMinutes: number,
        wasoMinutes: number,
        deepSleepMinutes: number,
        remSleepMinutes: number,
        lightSleepMinutes: number,
        timeLabel: string,
        logCount: number
    };
    steps: {
        date: string;
        intervals: {
            distanceKm: number;
            steps: number;
            timeLabel: string;
            timeWalkedMinutes: number;
        }[];
        totalDistanceKm: number;
        totalSteps: number;
        totalWalkedMinutes: number;
    };
    weightHistory: {
        month: string;
        weight: number;
    }[];
    workoutLogs: Record<string, {
        name: string;
        time: string;
    }>;
}

export function updateUserField<T extends Record<string, any>>(obj: T, field: string, value: any): T {
    if (!obj) return obj;

    // 1. Nếu field nằm ngay ở root
    if (field in obj) {
        return { ...obj, [field]: value };
    }

    // 2. Tự động duyệt qua các nhóm con (profile, metrics, nutrition, steps,...)
    for (const parentKey of Object.keys(obj)) {
        const sub = obj[parentKey];
        if (sub && typeof sub === 'object' && !Array.isArray(sub)) {
            if (field in sub) {
                return {
                    ...obj,
                    [parentKey]: {
                        ...sub,
                        [field]: value
                    }
                };
            }
        }
    }

    // 3. Nếu không tìm thấy trong nhóm nào, fallback gán vào root
    return {
        ...obj,
        [field]: value
    };
}
