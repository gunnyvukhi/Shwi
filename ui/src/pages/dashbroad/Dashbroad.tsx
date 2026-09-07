import { useState, useEffect } from 'react';
import './Dashbroad.css';
import {
    Heart,
    Moon,
    Activity,
    Flame,
    TrendingDown,
    TrendingUp,
    Edit2,
    X,
    Clock
} from 'lucide-react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
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
import {
    userService,
    type ActivityItem,
    type WeightItem,
    type HeartRateItem,
    type SleepItem,
    type StepItem,
    type WorkoutItem,
    type FoodIntakeItem
} from '../../services/userService';

// Temp / Fallback Data
const tempActivityDataDay: ActivityItem[] = [
    { time: '6AM', cal: 0 }, { time: '9AM', cal: 0 }, { time: '12PM', cal: 0 },
    { time: '3PM', cal: 0 }, { time: '6PM', cal: 0 }, { time: '9PM', cal: 0 },
];
const tempActivityDataWeek: ActivityItem[] = [
    { time: 'Mon', cal: 0 }, { time: 'Tue', cal: 0 }, { time: 'Wed', cal: 0 },
    { time: 'Thu', cal: 0 }, { time: 'Fri', cal: 0 }, { time: 'Sat', cal: 0 }, { time: 'Sun', cal: 0 },
];
const tempActivityDataMonth: ActivityItem[] = [
    { time: 'W1', cal: 0 }, { time: 'W2', cal: 0 }, { time: 'W3', cal: 0 }, { time: 'W4', cal: 0 },
];

const tempWeightDataMonth: WeightItem[] = [
    { month: 'Jan', weight: 0 }, { month: 'Feb', weight: 0 }, { month: 'Mar', weight: 0 },
    { month: 'Apr', weight: 0 }, { month: 'May', weight: 0 }, { month: 'Jun', weight: 0 },
    { month: 'Jul', weight: 0 },
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
    const [activityFilter, setActivityFilter] = useState<'Day' | 'Week' | 'Month'>('Day');
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [goalType, setGoalType] = useState<'Lose' | 'Gain'>('Lose');
    const [targetWeight, setTargetWeight] = useState(50);
    const [isDarkTheme, setIsDarkTheme] = useState(() => {
        const saved = localStorage.getItem('shwi_theme');
        return saved !== null ? saved === 'dark' : true;
    });

    const [activityDataDay, setActivityDataDay] = useState<ActivityItem[]>(tempActivityDataDay);
    const [activityDataWeek, setActivityDataWeek] = useState<ActivityItem[]>(tempActivityDataWeek);
    const [activityDataMonth, setActivityDataMonth] = useState<ActivityItem[]>(tempActivityDataMonth);
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
                setActivityDataDay(data.activityDataDay && data.activityDataDay.length > 0 ? data.activityDataDay : tempActivityDataDay);
                setActivityDataWeek(data.activityDataWeek && data.activityDataWeek.length > 0 ? data.activityDataWeek : tempActivityDataWeek);
                setActivityDataMonth(data.activityDataMonth && data.activityDataMonth.length > 0 ? data.activityDataMonth : tempActivityDataMonth);
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
                setActivityDataDay(tempActivityDataDay);
                setActivityDataWeek(tempActivityDataWeek);
                setActivityDataMonth(tempActivityDataMonth);
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

    const activeActivityData =
        activityFilter === 'Day' ? activityDataDay :
            activityFilter === 'Week' ? activityDataWeek : activityDataMonth;

    const getFilterLabel = (filter: 'Day' | 'Week' | 'Month') => {
        if (filter === 'Day') return t('dashboard.day');
        if (filter === 'Week') return t('dashboard.week');
        return t('dashboard.month');
    };

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

    const newestTime = latestHr?.timeLabel || (latestHr?.recordedAt ? new Date(latestHr.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

    // Sleep, Step & Calorie derived stats
    const latestSleep = sleepLogs.length > 0 ? sleepLogs[0] : null;
    const displaySleepValue = latestSleep ? latestSleep.durationDisplay : "7 h 23 m";
    const displaySleepQuality = latestSleep && latestSleep.sleepQuality ? `${latestSleep.sleepQuality}%` : "85%";

    const latestStep = stepLogs.length > 0 ? stepLogs[0] : null;
    const displayStepValue = latestStep ? latestStep.steps.toLocaleString() : "12,456";
    const displayStepGoal = latestStep ? latestStep.targetSteps.toLocaleString() : "10,000";

    const totalBurned = workoutLogs.length > 0
        ? Math.round(workoutLogs.reduce((acc, w) => acc + w.caloriesBurned, 0) + 2100)
        : 2640;
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
                <div className="stats-grid">
                    {/* Heart Rate Box (Newest in DB, Separated Normal & Resting) */}
                    <div className="stat-card hr-stat-card">
                        <div className="stat-header">
                            <div className="stat-icon-wrap" style={{ backgroundColor: theme.accents.roseBg }}>
                                <Heart color={theme.accents.rose} />
                            </div>
                            <div className="stat-label-wrap">
                                <span className="stat-label">{t('dashboard.heartRate')}</span>
                                <span className="hr-live-tag">
                                    <span className="pulse-dot-mini" /> Live
                                </span>
                            </div>
                        </div>

                        <div className="hr-metrics-row">
                            <div className="hr-metric-block">
                                <span className="hr-type-label">{language === 'vi' ? 'Bình thường' : 'Normal'}</span>
                                <div className="hr-val-text">
                                    {normalBpm} <span className="stat-unit-text">bpm</span>
                                </div>
                            </div>
                            <div className="hr-metric-divider" />
                            <div className="hr-metric-block">
                                <span className="hr-type-label">{language === 'vi' ? 'Khi nghỉ' : 'Resting'}</span>
                                <div className="hr-val-text" style={{ color: theme.accents.emerald }}>
                                    {restingBpm} <span className="stat-unit-text">bpm</span>
                                </div>
                            </div>
                        </div>

                        <div className="hr-timestamp">
                            <Clock size={12} style={{ opacity: 0.7 }} />
                            <span>{language === 'vi' ? 'Bản ghi mới nhất' : 'Newest reading'}: {newestTime || 'Recent'}</span>
                        </div>
                    </div>

                    <StatCard
                        icon={<Moon color={theme.accents.indigo} />}
                        label={t('dashboard.sleep')}
                        value={displaySleepValue}
                        subValue={t('dashboard.sleepQuality', { val: displaySleepQuality })}
                        bg={theme.accents.indigoBg}
                    />
                    <StatCard
                        icon={<Activity color="var(--primary)" />}
                        label={t('dashboard.steps')}
                        value={displayStepValue}
                        subValue={t('dashboard.stepGoal', { val: displayStepGoal })}
                        bg={theme.accents.skyBg}
                    />
                    <StatCard
                        icon={<Flame color={theme.accents.orange} />}
                        label={t('dashboard.caloriesBurned')}
                        value={`${totalBurned} kcal`}
                        subValue={t('dashboard.caloriesIn', { val: `${totalIn} Kcal` })}
                        bg={theme.accents.orangeBg}
                    />
                </div>

                {/* Charts & Body Layout */}
                <div className="main-grid">
                    <div className="charts-col">

                        {/* Activity Chart */}
                        <div className="card-panel">
                            <div className="card-header">
                                <div>
                                    <h2 className="card-title">
                                        {t('dashboard.activityBurnTitle')} <span className="text-primary">{t('dashboard.activityBurnHighlight')}</span>
                                    </h2>
                                    <p className="card-subtitle">{t('dashboard.activityBurnSub')}</p>
                                </div>
                                <div className="filter-pills">
                                    {(['Day', 'Week', 'Month'] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setActivityFilter(filter)}
                                            className={`filter-btn ${activityFilter === filter ? 'active' : ''}`}
                                        >
                                            {getFilterLabel(filter)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activeActivityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
                                        <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--chart-text)" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card-solid)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} itemStyle={{ color: 'var(--primary)' }} />
                                        <Area type="monotone" dataKey="cal" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorCal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

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

// Sub-components
interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    subValue: string;
    bg: string;
}

function StatCard({ icon, label, value, subValue, bg }: StatCardProps) {
    return (
        <div className="stat-card">
            <div className="stat-header">
                <div className="stat-icon-wrap" style={{ backgroundColor: bg }}>{icon}</div>
                <span className="stat-label">{label}</span>
            </div>
            <div>
                <div className="stat-value">{value}</div>
                <div className="stat-subval">{subValue}</div>
            </div>
        </div>
    );
}
