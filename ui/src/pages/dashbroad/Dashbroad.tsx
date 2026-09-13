import { useState, useEffect } from 'react';
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
import MovementCard from '../../components/ui/card/MovementCard';
import StatCard from '../../components/ui/card/StatCard';
import NutritionMiniCard from '../../components/ui/card/NutritionMiniCard';
import ActivityChart from '../../components/ui/chart/ActivityChart';
import {
    userService,
    type WeightItem,
    type HeartRateItem,
    type SleepItem,
    type StepItem,
    type WorkoutItem,
    type FoodIntakeItem
} from '../../services/userService';

// Temp / Fallback Data

const tempWeightDataMonth: WeightItem[] = [
    { month: '01/26', weight: 0 }, { month: '02/26', weight: 0 }, { month: '03/26', weight: 0 },
    { month: '04/26', weight: 0 }, { month: '05/26', weight: 0 }, { month: '06/26', weight: 0 },
    { month: '07/26', weight: 0 },
];

const defaultHeartRateLogs: HeartRateItem[] = [
    { id: 1, userId: '1', bpm: 117, restingBpm: 62, status: 'Peak', timeLabel: '07:15 PM' },
    { id: 2, userId: '1', bpm: 135, restingBpm: 62, status: 'Cardio', timeLabel: '05:45 PM' },
    { id: 3, userId: '1', bpm: 82, restingBpm: 62, status: 'Normal', timeLabel: '02:15 PM' },
    { id: 4, userId: '1', bpm: 74, restingBpm: 62, status: 'Normal', timeLabel: '11:00 AM' },
    { id: 5, userId: '1', bpm: 62, restingBpm: 62, status: 'Resting', timeLabel: '08:30 AM' },
];

export default function Dashboard() {
    const { t, language } = useLanguage();
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [goalType, setGoalType] = useState<'Lose' | 'Gain'>('Lose');
    const [targetWeight, setTargetWeight] = useState(50);
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('shwi_theme');
        return saved !== null ? saved === 'dark' : true;
    });

    const [weightDataMonth, setWeightDataMonth] = useState<WeightItem[]>(tempWeightDataMonth);

    // Specialized Health & Fitness States from DB
    const [heartRateLogs, setHeartRateLogs] = useState<HeartRateItem[]>(defaultHeartRateLogs);
    const [sleepLogs, setSleepLogs] = useState<SleepItem[]>([]);
    const [stepLogs, setStepLogs] = useState<StepItem[]>([]);
    const [workoutLogs, setWorkoutLogs] = useState<WorkoutItem[]>([]);
    const [foodIntakeLogs, setFoodIntakeLogs] = useState<FoodIntakeItem[]>([]);

    useEffect(() => {
        let isMounted = true;
        userService.getDashboardData()
            .then(data => {
                if (!isMounted) return;
                setWeightDataMonth(data.weightDataMonth && data.weightDataMonth.length > 0 ? data.weightDataMonth : tempWeightDataMonth);

                if (data.heartRateLogs && data.heartRateLogs.length > 0) {
                    setHeartRateLogs(data.heartRateLogs);
                }
                if (data.sleepLogs) setSleepLogs(data.sleepLogs);
                if (data.stepLogs) setStepLogs(data.stepLogs);
                if (data.workoutLogs) setWorkoutLogs(data.workoutLogs);
                if (data.foodIntakeLogs) setFoodIntakeLogs(data.foodIntakeLogs);
            })
            .catch(err => {
                console.error("Failed to fetch dashboard data from API:", err);
                if (!isMounted) return;

                setWeightDataMonth(tempWeightDataMonth);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleToggleTheme = () => {
        setIsDarkTheme((prev) => {
            const next = !prev;
            localStorage.setItem('shwi_theme', next ? 'dark' : 'light');
            return next;
        });
    };

    const currentWeight = 56.0;

    const currentDate = language === 'vi'
        ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).replace('tháng', 'Tháng')
        : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Compute newest heart rate in the database, separating Normal and Resting
    const latestHr: HeartRateItem | null = heartRateLogs.length > 0 ? heartRateLogs[0] : null;

    let normalBpm = 78;
    let restingBpm = 62;

    const normalLog = heartRateLogs.find(log => log.status?.toLowerCase() === 'normal')
        || heartRateLogs.find(log => log.status?.toLowerCase() !== 'resting');

    const restingLog = heartRateLogs.find(log => log.status?.toLowerCase() === 'resting')
        || heartRateLogs.find(log => log.restingBpm && log.restingBpm > 0);

    if (normalLog) {
        normalBpm = normalLog.bpm;
    } else if (latestHr) {
        normalBpm = latestHr.bpm;
    }

    if (restingLog) {
        restingBpm = restingLog.status?.toLowerCase() === 'resting' ? restingLog.bpm : (restingLog.restingBpm || 62);
    } else if (latestHr?.restingBpm) {
        restingBpm = latestHr.restingBpm;
    }

    const displayNormalBpm = `${normalBpm} bpm`;
    const displayRestingBpm = `${restingBpm} bpm`;

    // Sleep, Step & Calorie derived stats
    const latestSleep = sleepLogs.length > 0 ? sleepLogs[0] : null;
    const displaySleepValue = latestSleep ? latestSleep.durationDisplay : "7 h 23 m";
    const displaySleepQuality = latestSleep && latestSleep.sleepQuality ? `${latestSleep.sleepQuality}%` : "85%";

    const latestStep = stepLogs.length > 0 ? stepLogs[0] : null;

    const activeCaloriesBurned = workoutLogs.length > 0
        ? Math.round(workoutLogs.reduce((acc, w) => acc + w.caloriesBurned, 0))
        : 640;
    const totalIn = foodIntakeLogs.length > 0
        ? Math.round(foodIntakeLogs.reduce((acc, f) => acc + f.calories, 0))
        : 2400;

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
                            stepsGoal={latestStep ? latestStep.targetSteps : 10000}
                            stepsCurrent={latestStep ? latestStep.steps : 12456}
                            caloriesBurned={activeCaloriesBurned}
                        />
                    </div>
                    {/* Right stacked — 2/5 width */}
                    <div className="stats-grid-side">
                        <StatCard
                            icon={<Heart size={20} />}
                            label={t('dashboard.heartRate') || 'Heart Rate'}
                            value={displayNormalBpm || '117 bpm'}
                            subValue={t('dashboard.resting', { val: displayRestingBpm }) || 'Resting: 62 bpm'}
                            badgeColorClass="badge-rose"
                        />
                        <StatCard
                            icon={<Moon size={20} />}
                            label={t('dashboard.sleep') || 'Sleep'}
                            value={displaySleepValue || '7 h 23 m'}
                            subValue={t('dashboard.sleepQuality', { val: displaySleepQuality }) || 'Quality: 85%'}
                            badgeColorClass="badge-indigo"
                        />
                        <NutritionMiniCard caloriesIn={totalIn} />
                    </div>
                </div>

                {/* Charts & Body Layout */}
                <div className="main-grid">
                    <div className="charts-col">

                        {/* Activity Chart */}
                        <ActivityChart />

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

                        <button className="btn-primary" onClick={() => setGoalModalOpen(false)}>
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

