import { useState, useEffect, useCallback } from 'react';
import './Dashbroad.css';
import {
    Heart,
    Moon,
    TrendingDown,
    TrendingUp,
    Edit2,
    X,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import Header from '../../components/layout/Header';
import MobileNav from '../../components/layout/MobileNav';
import theme, { getThemeStyles } from '../../config/theme';
import FullBodyMuscles from '../../components/ui/FullBodyMuscles/FullBodyMuscles';
import { useLanguage } from '../../context/LanguageContext';
import MovementCard, { type GymWorkoutSession } from '../../components/ui/card/MovementCard';
import StatCard from '../../components/ui/card/StatCard';
import NutritionMiniCard from '../../components/ui/card/NutritionMiniCard';
import ActivityChart from '../../components/ui/chart/ActivityChart';
import {
    userService,
    type WeightItem,
    type ActivityItem,
    type FullDashboardData
} from '../../services/userService';
import {
    subscribeToHeartRate,
    subscribeToRestingHeartRate,
    type RealtimeHeartRateData
} from '../../services/firebaseRealtime';

const DASHBOARD_STORAGE_KEY = 'shwi_dashbroad_data';

// Temp / Fallback Data
const tempWeightDataMonth: WeightItem[] = [
    { month: '01/26', weight: 70 }, { month: '02/26', weight: 70 }, { month: '03/26', weight: 70 },
    { month: '04/26', weight: 70 }, { month: '05/26', weight: 70 }, { month: '06/26', weight: 70 },
];

function getStoredDashboard(): FullDashboardData | null {
    try {
        const raw = sessionStorage.getItem(DASHBOARD_STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('[Dashboard] Could not parse dashboard data from sessionStorage:', e);
    }
    return null;
}

export default function Dashboard() {
    const { t, language } = useLanguage();
    const [goalModalOpen, setGoalModalOpen] = useState(false);

    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('shwi_theme');
        return saved !== null ? saved === 'dark' : true;
    });

    // 1. Initialize states from sessionStorage cache if present (Instant zero-flicker render)
    const initialStored = getStoredDashboard();

    const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(initialStored);
    const [goalType, setGoalType] = useState<'Lose' | 'Gain'>(() => {
        return initialStored?.profile?.fitnessGoal === 1 ? 'Gain' : 'Lose';
    });
    const [targetWeight, setTargetWeight] = useState<number>(() => {
        return initialStored?.profile?.targetWeight ?? 70;
    });
    const [weightDataMonth, setWeightDataMonth] = useState<WeightItem[]>(() => {
        if (initialStored?.weightHistory && initialStored.weightHistory.length > 0) {
            return initialStored.weightHistory;
        }
        return tempWeightDataMonth;
    });

    // Real-time Heart Rate states directly from Firebase RTDB
    const [realtimeHr, setRealtimeHr] = useState<RealtimeHeartRateData | null>(null);
    const [realtimeRhr, setRealtimeRhr] = useState<RealtimeHeartRateData | null>(null);

    // Subscribe to Real-time Heart Rate & Resting Heart Rate directly from Firebase RTDB
    useEffect(() => {
        const userId = dashboardData?.id || dashboardData?.profile?.id;
        if (!userId) return;

        const unsubscribeHr = subscribeToHeartRate(userId, (data) => {
            if (data && data.bpm) {
                setRealtimeHr(data);
            }
        });

        const unsubscribeRhr = subscribeToRestingHeartRate(userId, (data) => {
            if (data && data.bpm) {
                setRealtimeRhr(data);
            }
        });

        return () => {
            unsubscribeHr();
            unsubscribeRhr();
        };
    }, [dashboardData?.id, dashboardData?.profile?.id]);

    // Sync all states when dashboardData changes
    const applyDashboardData = useCallback((data: FullDashboardData) => {
        setDashboardData(data);
        if (data.profile) {
            if (data.profile.targetWeight !== undefined && data.profile.targetWeight !== null) {
                setTargetWeight(data.profile.targetWeight);
            }
            if (data.profile.fitnessGoal !== undefined && data.profile.fitnessGoal !== null) {
                setGoalType(data.profile.fitnessGoal === 1 ? 'Gain' : 'Lose');
            }
        }
        if (data.weightHistory && data.weightHistory.length > 0) {
            setWeightDataMonth(data.weightHistory);
        }
    }, []);

    // 2. Fetch fresh data from API /api/user/dashbroad on initial mount & page reloads
    useEffect(() => {
        let isMounted = true;

        userService.getDashboardData()
            .then(freshData => {
                if (!isMounted) return;

                // Save fresh response to sessionStorage
                try {
                    sessionStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(freshData));
                } catch (e) {
                    console.warn('[Dashboard] Could not save fresh data to sessionStorage:', e);
                }

                // Update UI states
                applyDashboardData(freshData);
            })
            .catch(err => {
                console.error('[Dashboard] Failed to fetch /api/user/dashbroad from API:', err);
            });

        return () => {
            isMounted = false;
        };
    }, [applyDashboardData]);

    const handleToggleTheme = () => {
        setIsDarkTheme((prev) => {
            const next = !prev;
            localStorage.setItem('shwi_theme', next ? 'dark' : 'light');
            return next;
        });
    };

    // 3. Handle saving Target & Goal with Optimistic UI + SessionStorage + Silent Background PUT Request
    const handleSaveGoal = async () => {
        const newGoal = goalType === 'Lose' ? 0 : 1;
        const newTarget = Number(targetWeight);

        // A. Immediately update UI state and close modal (Zero delay)
        setGoalModalOpen(false);

        // B. Immediately update sessionStorage
        try {
            const stored = getStoredDashboard() || dashboardData;
            if (stored) {
                const updated: FullDashboardData = {
                    ...stored,
                    profile: {
                        ...stored.profile,
                        targetWeight: newTarget,
                        fitnessGoal: newGoal
                    }
                };
                sessionStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(updated));
                setDashboardData(updated);
            }
        } catch (e) {
            console.warn('[Dashboard] Error updating sessionStorage:', e);
        }

        // C. Send background PUT request to API ngầm (No page refresh)
        try {
            await userService.updateProfile({
                targetWeight: newTarget,
                fitnessGoal: newGoal
            });
            console.log('[Dashboard] Target updated in background successfully.');
        } catch (err) {
            console.error('[Dashboard Error] Failed to update target in background:', err);
        }
    };

    const currentDate = language === 'vi'
        ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).replace('tháng', 'Tháng')
        : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Extract metrics & values from dashboardData
    const currentWeight = dashboardData?.metrics?.weight ?? 70.0;
    const stepsGoal = dashboardData?.profile?.targetSteps ?? 10000;
    const stepsCurrent = dashboardData?.steps?.totalSteps ?? 0;

    // Active calories: from steps or workout sessions
    const activeCaloriesBurned = dashboardData?.steps?.totalSteps
        ? Math.round(dashboardData.steps.totalSteps * 0.04)
        : 640;

    // Heart rate values (Prioritizing direct Real-time stream from Firebase RTDB)
    const normalBpm = realtimeHr?.bpm ?? dashboardData?.heartRate?.bpm ?? 78;
    const restingBpm = realtimeRhr?.bpm ?? dashboardData?.restingHeartRate?.bpm ?? 58;
    const displayNormalBpm = `${normalBpm} bpm`;
    const displayRestingBpm = `${restingBpm} bpm`;

    // Sleep stats
    const displaySleepValue = dashboardData?.sleep?.durationDisplay || '7 h 45 m';
    const displaySleepQuality = dashboardData?.sleep?.sleepEfficiency
        ? `${dashboardData.sleep.sleepEfficiency}%`
        : '85%';

    // Nutrition stats
    const totalIn = dashboardData?.nutrition?.calories
        ? Math.round(dashboardData.nutrition.calories)
        : 0;

    // Activity Day data mapped from step intervals
    const activityDataDay: ActivityItem[] = dashboardData?.steps?.intervals && dashboardData.steps.intervals.length > 0
        ? dashboardData.steps.intervals.map(i => ({
            time: i.timeLabel,
            cal: Math.round(i.steps * 0.04)
        }))
        : [
            { time: '6AM', cal: 50 }, { time: '9AM', cal: 140 }, { time: '12PM', cal: 230 },
            { time: '3PM', cal: 320 }, { time: '6PM', cal: 420 }, { time: '9PM', cal: 490 }
        ];

    // Gym workout week sessions mapped from workoutLogs
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const gymWorkoutData: GymWorkoutSession[] = dayNames.map(day => {
        const fullDayName = {
            'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
            'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
        }[day] || day;
        const entry = dashboardData?.workoutLogs ? dashboardData.workoutLogs[fullDayName] : undefined;
        return {
            day,
            mins: entry ? 60 : 0,
            active: Boolean(entry)
        };
    });

    return (
        <div
            className={`app-wrapper dashboard-app-wrapper ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}
            style={getThemeStyles(isDarkTheme)}
        >
            <Header isDarkTheme={isDarkTheme} onToggleTheme={handleToggleTheme} />

            {/* Main Content */}
            <main>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">{t('dashboard.overview')}</h1>
                        <p className="page-date">
                            {currentDate}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="dashboard-stats-grid">
                    {/* Movement card — 3/5 width */}
                    <div className="stats-grid-movement">
                        <MovementCard
                            stepsGoal={stepsGoal}
                            stepsCurrent={stepsCurrent}
                            caloriesBurned={activeCaloriesBurned}
                            gymWorkoutData={gymWorkoutData}
                        />
                    </div>
                    {/* Right stacked — 2/5 width */}
                    <div className="stats-grid-side">
                        <StatCard
                            icon={<Heart size={20} />}
                            label={
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                    {t('dashboard.heartRate') || 'Heart Rate'}
                                    {realtimeHr && (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                width: '7px',
                                                height: '7px',
                                                borderRadius: '50%',
                                                backgroundColor: '#10b981',
                                                boxShadow: '0 0 6px #10b981'
                                            }}
                                            title="Live Realtime"
                                        />
                                    )}
                                </span>
                            }
                            value={displayNormalBpm}
                            subValue={t('dashboard.resting', { val: displayRestingBpm }) || `Resting: ${displayRestingBpm}`}
                            badgeColorClass="badge-rose"
                        />
                        <StatCard
                            icon={<Moon size={20} />}
                            label={t('dashboard.sleep') || 'Sleep'}
                            value={displaySleepValue}
                            subValue={t('dashboard.sleepQuality', { val: displaySleepQuality }) || `Quality: ${displaySleepQuality}`}
                            badgeColorClass="badge-indigo"
                        />
                        <NutritionMiniCard caloriesIn={totalIn} />
                    </div>
                </div>

                {/* Charts & Body Layout */}
                <div className="main-grid">
                    <div className="charts-col">

                        {/* Activity Chart */}
                        <ActivityChart activityDataDay={activityDataDay} />

                        {/* Weight Progress (with Line Chart and Circle) */}
                        <div className="card-panel">
                            <div className="card-header">
                                <div>
                                    <h2 className="card-title">
                                        {t('dashboard.weightProgressTitle')} <span className="text-primary">{t('dashboard.weightProgressHighlight')}</span>
                                    </h2>
                                    <div className="goal-status" style={{ color: goalType === 'Lose' ? theme.accents.emerald : 'var(--primary)' }}>
                                        {goalType === 'Lose' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                                        <span>{t('dashboard.goalWeight', { val: targetWeight })}</span>
                                    </div>
                                </div>
                                <button className="btn-secondary" onClick={() => setGoalModalOpen(true)}>
                                    <Edit2 size={14} /> {t('dashboard.adjustGoal')}
                                </button>
                            </div>

                            <div className="weight-layout">
                                {/* Line Chart */}
                                <div className="weight-chart-wrapper">
                                    <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                                        <LineChart data={weightDataMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
                                            <XAxis dataKey="month" stroke="var(--chart-text)" fontSize={12} tickLine={false} axisLine={false} />
                                            <YAxis stroke="var(--chart-text)" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} axisLine={false} />
                                            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card-solid)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                                            <Line type="monotone" dataKey="weight" stroke={theme.accents.rose} strokeWidth={3} dot={{ fill: 'var(--bg-card-solid)', stroke: theme.accents.rose, strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Circle Chart */}
                                <div className="circle-widget">
                                    <svg viewBox="0 0 100 100" className="circle-svg">
                                        <circle cx="50" cy="50" r="45" className="circle-bg" />
                                        <circle cx="50" cy="50" r="45" className="circle-progress" />
                                    </svg>
                                    <div className="circle-content">
                                        <span className="circle-val">{currentWeight}</span>
                                        <span className="circle-unit">kg</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Body Muscle Interactive Panel */}
                    <div className="card-panel body-schema-panel">
                        <div className="card-header" style={{ width: '100%', justifyContent: 'center', textAlign: 'center', marginBottom: '1rem' }}>
                            <h2 className="card-title" style={{ textAlign: 'center' }}>
                                {t('dashboard.bodyConditionTitle')} <span className="text-primary">{t('dashboard.bodyConditionHighlight')}</span>
                            </h2>
                        </div>
                        <FullBodyMuscles />
                    </div>
                </div>
            </main>

            {/* Goal Modal */}
            {goalModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setGoalModalOpen(false)}><X size={20} /></button>
                        <h3 className="modal-title">
                            {t('dashboard.adjustGoal')}
                        </h3>

                        <div className="form-group">
                            <label className="form-label">{t('dashboard.goalType')}</label>
                            <div className="goal-toggle-grid">
                                <button
                                    className={`goal-toggle-btn ${goalType === 'Lose' ? 'active-lose' : ''}`}
                                    onClick={() => setGoalType('Lose')}
                                >
                                    {t('dashboard.loseWeight')}
                                </button>
                                <button
                                    className={`goal-toggle-btn ${goalType === 'Gain' ? 'active-gain' : ''}`}
                                    onClick={() => setGoalType('Gain')}
                                >
                                    {t('dashboard.gainWeight')}
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('dashboard.targetWeight')}</label>
                            <input
                                type="number"
                                className="form-input"
                                value={targetWeight}
                                onChange={(e) => setTargetWeight(Number(e.target.value))}
                            />
                        </div>

                        <button className="btn-primary" onClick={handleSaveGoal}>
                            {t('dashboard.saveChanges')}
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Nav */}
            <MobileNav activeNav="dashboard" />
        </div>
    );
}
