import { useState } from 'react';
import './Dashbroad.css';
import {
    Heart,
    Moon,
    Activity,
    Flame,
    TrendingDown,
    TrendingUp,
    Edit2,
    X
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

// Mock Data
const activityDataDay = [
    { time: '6AM', cal: 50 }, { time: '9AM', cal: 120 }, { time: '12PM', cal: 80 },
    { time: '3PM', cal: 250 }, { time: '6PM', cal: 350 }, { time: '9PM', cal: 100 },
];
const activityDataWeek = [
    { time: 'Mon', cal: 450 }, { time: 'Tue', cal: 520 }, { time: 'Wed', cal: 380 },
    { time: 'Thu', cal: 600 }, { time: 'Fri', cal: 410 }, { time: 'Sat', cal: 800 }, { time: 'Sun', cal: 300 },
];
const activityDataMonth = [
    { time: 'W1', cal: 2800 }, { time: 'W2', cal: 3100 }, { time: 'W3', cal: 2950 }, { time: 'W4', cal: 3400 },
];

const weightDataMonth = [
    { month: 'Jan', weight: 60 }, { month: 'Feb', weight: 59.2 }, { month: 'Mar', weight: 58.5 },
    { month: 'Apr', weight: 58.0 }, { month: 'May', weight: 57.1 }, { month: 'Jun', weight: 56.5 },
    { month: 'Jul', weight: 56.0 },
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
                            {language === 'vi' ? 'Thứ Năm, 24 Tháng 10' : 'Thursday, October 24'}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard
                        icon={<Heart color={theme.accents.rose} />}
                        label={t('dashboard.heartRate')}
                        value="117 bpm"
                        subValue={t('dashboard.resting', { val: '62 bpm' })}
                        bg={theme.accents.roseBg}
                    />
                    <StatCard
                        icon={<Moon color={theme.accents.indigo} />}
                        label={t('dashboard.sleep')}
                        value="7 h 23 m"
                        subValue={t('dashboard.sleepQuality', { val: '85%' })}
                        bg={theme.accents.indigoBg}
                    />
                    <StatCard
                        icon={<Activity color="var(--primary)" />}
                        label={t('dashboard.steps')}
                        value="12,456"
                        subValue={t('dashboard.stepGoal', { val: '10,000' })}
                        bg={theme.accents.skyBg}
                    />
                    <StatCard
                        icon={<Flame color={theme.accents.orange} />}
                        label={t('dashboard.activeTime')}
                        value="1 h 49 m"
                        subValue={t('dashboard.calories', { val: '640 kcal' })}
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
