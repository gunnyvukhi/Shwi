import { useState } from 'react';
import './Dashbroad.css';
import {
    Heart,
    Moon,
    Activity,
    Flame,
    TrendingDown,
    TrendingUp,
    Home,
    BarChart2,
    User,
    Target,
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
import theme, { getThemeStyles } from '../../config/theme';

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

    return (
        <div
            className={`app-wrapper ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}
            style={getThemeStyles(isDarkTheme)}
        >
            <Header isDarkTheme={isDarkTheme} onToggleTheme={handleToggleTheme} />

            {/* Main Content */}
            <main>
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Overview</h1>
                        <p className="page-date">Thursday, October 24</p>
                    </div>
                    <button className="share-btn">Share Stats</button>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <StatCard icon={<Heart color={theme.accents.rose} />} label="Heart Rate" value="117 bpm" subValue="Resting: 62 bpm" bg={theme.accents.roseBg} />
                    <StatCard icon={<Moon color={theme.accents.indigo} />} label="Sleep" value="7 h 23 m" subValue="Quality: 85%" bg={theme.accents.indigoBg} />
                    <StatCard icon={<Activity color="var(--primary)" />} label="Steps" value="12,456" subValue="Goal: 10,000" bg={theme.accents.skyBg} />
                    <StatCard icon={<Flame color={theme.accents.orange} />} label="Active Time" value="1 h 49 m" subValue="Calories: 640 kcal" bg={theme.accents.orangeBg} />
                </div>

                {/* Charts & Body Layout */}
                <div className="main-grid">
                    <div className="charts-col">

                        {/* Activity Chart */}
                        <div className="card-panel">
                            <div className="card-header">
                                <div>
                                    <h2 className="card-title">Activity <span className="text-primary">Burn</span></h2>
                                    <p className="card-subtitle">Calories burned over time</p>
                                </div>
                                <div className="filter-pills">
                                    {(['Day', 'Week', 'Month'] as const).map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => setActivityFilter(filter)}
                                            className={`filter-btn ${activityFilter === filter ? 'active' : ''}`}
                                        >
                                            {filter}
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
                                    <h2 className="card-title">Weight <span className="text-primary">Progress</span></h2>
                                    <div className="goal-status" style={{ color: goalType === 'Lose' ? theme.accents.emerald : 'var(--primary)' }}>
                                        {goalType === 'Lose' ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                                        <span>Goal: {targetWeight} kg</span>
                                    </div>
                                </div>
                                <button className="btn-secondary" onClick={() => setGoalModalOpen(true)}>
                                    <Edit2 size={14} /> Adjust Goal
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

                    {/* Body Schema Panel */}
                    <div className="card-panel body-schema-panel">
                        <div className="card-header" style={{ marginBottom: '2rem' }}>
                            <h2 className="card-title">Body <span className="text-primary">Condition</span></h2>
                            <div className="schema-icon"><Target size={18} /></div>
                        </div>

                        <div className="schema-visual">
                            <div className="schema-svg-wrap">
                                <svg viewBox="0 0 100 250" className="schema-svg">
                                    {/* Head */}
                                    <circle cx="50" cy="25" r="15" fill="none" stroke="var(--svg-stroke)" strokeWidth="3" />
                                    <circle cx="50" cy="25" r="15" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="40 100" strokeDashoffset="20" />
                                    {/* Torso */}
                                    <path d="M 35 50 Q 50 45 65 50 L 70 110 Q 50 120 30 110 Z" fill="none" stroke="var(--svg-stroke)" strokeWidth="3" />
                                    <path d="M 35 50 Q 50 45 65 50 L 70 110 Q 50 120 30 110 Z" fill="none" stroke={theme.accents.rose} strokeWidth="3" strokeDasharray="80 200" strokeDashoffset="0" opacity="0.8" />
                                    {/* Arms */}
                                    <path d="M 35 50 Q 15 70 20 120" fill="none" stroke="var(--svg-stroke)" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M 65 50 Q 85 70 80 120" fill="none" stroke="var(--svg-stroke)" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M 65 50 Q 85 70 80 120" fill="none" stroke={theme.accents.emerald} strokeWidth="3" strokeLinecap="round" strokeDasharray="30 100" strokeDashoffset="10" opacity="0.8" />
                                    {/* Legs */}
                                    <path d="M 40 115 L 35 180 L 30 230" fill="none" stroke="var(--svg-stroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M 60 115 L 65 180 L 70 230" fill="none" stroke="var(--svg-stroke)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M 40 115 L 35 180 L 30 230" fill="none" stroke={theme.accents.amber} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="50 150" strokeDashoffset="20" opacity="0.8" />
                                </svg>

                                {/* Condition Markers */}
                                <ConditionMarker top="10%" left="80%" color="var(--primary)" label="Mind" value="Focus" />
                                <ConditionMarker top="35%" left="-15%" color={theme.accents.rose} label="Core" value="Fatigued" />
                                <ConditionMarker top="40%" left="100%" color={theme.accents.emerald} label="Arms" value="Recovered" />
                                <ConditionMarker top="75%" left="5%" color={theme.accents.amber} label="Legs" value="Sore" />
                            </div>
                        </div>

                        <div className="schema-stats">
                            <div className="schema-stat-box">
                                <p className="schema-stat-label">Muscle Mass</p>
                                <p className="schema-stat-value">42.5 <span className="schema-stat-unit">kg</span></p>
                            </div>
                            <div className="schema-stat-box">
                                <p className="schema-stat-label">Body Fat</p>
                                <p className="schema-stat-value">14.2 <span className="schema-stat-unit">%</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Goal Modal */}
            {goalModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <button className="modal-close" onClick={() => setGoalModalOpen(false)}><X size={20} /></button>
                        <h3 className="modal-title">Adjust <span className="text-primary">Goal</span></h3>

                        <div className="form-group">
                            <label className="form-label">Goal Type</label>
                            <div className="goal-toggle-grid">
                                <button
                                    className={`goal-toggle-btn ${goalType === 'Lose' ? 'active-lose' : ''}`}
                                    onClick={() => setGoalType('Lose')}
                                >Lose Weight</button>
                                <button
                                    className={`goal-toggle-btn ${goalType === 'Gain' ? 'active-gain' : ''}`}
                                    onClick={() => setGoalType('Gain')}
                                >Gain Weight</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Target Weight (kg)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={targetWeight}
                                onChange={(e) => setTargetWeight(Number(e.target.value))}
                            />
                        </div>

                        <button className="btn-primary" onClick={() => setGoalModalOpen(false)}>
                            Save Changes
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Nav */}
            <nav className="mobile-nav">
                <div className="mobile-nav-inner">
                    <MobileNavItem icon={<Home size={24} />} label="Home" active />
                    <MobileNavItem icon={<BarChart2 size={24} />} label="Stats" />
                    <MobileNavItem icon={<Activity size={24} />} label="Workout" />
                    <MobileNavItem icon={<User size={24} />} label="Profile" />
                </div>
            </nav>
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

interface ConditionMarkerProps {
    top: string;
    left: string;
    color: string;
    label: string;
    value: string;
}

function ConditionMarker({ top, left, color, label, value }: ConditionMarkerProps) {
    return (
        <div className="marker-wrapper" style={{ top, left }}>
            <div className="marker-dot-wrap">
                <span className="marker-ping" style={{ backgroundColor: color }}></span>
                <span className="marker-dot" style={{ backgroundColor: color }}></span>
            </div>
            <div className="marker-tooltip">
                <span className="marker-label">{label}</span>
                <span className="marker-value">{value}</span>
            </div>
        </div>
    );
}

interface MobileNavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
}

function MobileNavItem({ icon, label, active = false }: MobileNavItemProps) {
    return (
        <button className={`mobile-nav-item ${active ? 'active' : ''}`}>
            {icon}
            <span className="mobile-nav-label">{label}</span>
        </button>
    );
}
