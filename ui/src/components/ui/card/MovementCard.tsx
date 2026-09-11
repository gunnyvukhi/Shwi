import './MovementCard.css';
import { Flame, Dumbbell } from 'lucide-react';
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export interface GymWorkoutSession {
    day: string;
    mins: number;
    active: boolean;
}

export const defaultGymWorkoutData: GymWorkoutSession[] = [
    { day: 'Mon', mins: 45, active: false },
    { day: 'Tue', mins: 60, active: false },
    { day: 'Wed', mins: 0, active: false },
    { day: 'Thu', mins: 50, active: false },
    { day: 'Fri', mins: 75, active: true },
    { day: 'Sat', mins: 40, active: false },
    { day: 'Sun', mins: 0, active: false },
];

export interface MovementCardProps {
    stepsGoal?: number;
    stepsCurrent?: number;
    caloriesBurned?: number;
    gymWorkoutData?: GymWorkoutSession[];
    className?: string;
}

export default function MovementCard({
    stepsGoal = 10000,
    stepsCurrent = 12456,
    caloriesBurned = 640,
    gymWorkoutData = defaultGymWorkoutData,
    className = ''
}: MovementCardProps) {
    const stepsPct = Math.min(100, Math.round((stepsCurrent / stepsGoal) * 100));

    const hourBars = [
        { h: '6A', v: 12 }, { h: '8A', v: 30 }, { h: '10A', v: 55 }, { h: '12P', v: 42 },
        { h: '2P', v: 80 }, { h: '4P', v: 95 }, { h: '6P', v: 68 }, { h: '8P', v: 20 },
    ];
    const maxV = Math.max(...hourBars.map(b => b.v));

    const totalGymMinutes = gymWorkoutData.reduce((acc, curr) => acc + curr.mins, 0);
    const activeSessions = gymWorkoutData.filter(d => d.mins > 0).length;

    const hrZones = [
        { zone: 'Peak', pct: 18, colorClass: 'movement-zone-peak' },
        { zone: 'Cardio', pct: 42, colorClass: 'movement-zone-cardio' },
        { zone: 'Fat Burn', pct: 40, colorClass: 'movement-zone-fatburn' },
    ];

    return (
        <div className={`movement-card ${className}`}>
            {/* Header */}
            <div className="movement-header">
                <span className="movement-title">Movement</span>
                <span className="movement-today-tag">Today</span>
            </div>

            {/* Steps + Active Time — side by side */}
            <div className="movement-metrics-row">
                {/* Steps Box */}
                <div className="movement-metric-box">
                    <div className="movement-metric-main">
                        <div className="movement-ring-wrapper">
                            <svg viewBox="0 0 56 56" className="movement-ring-svg">
                                <circle cx="28" cy="28" r="23" className="movement-ring-bg" />
                                <circle
                                    cx="28" cy="28" r="23"
                                    className="movement-ring-progress"
                                    strokeDasharray={`${2 * Math.PI * 23}`}
                                    strokeDashoffset={`${2 * Math.PI * 23 * (1 - stepsPct / 100)}`}
                                />
                            </svg>
                            <div className="movement-ring-center">
                                <span className="movement-ring-text">{stepsPct}%</span>
                            </div>
                        </div>
                        <div className="movement-metric-details">
                            <p className="movement-metric-label">Steps</p>
                            <p className="movement-metric-value">{stepsCurrent.toLocaleString()}</p>
                            <p className="movement-metric-sub">/ {stepsGoal.toLocaleString()} goal</p>
                        </div>
                    </div>

                    {/* Hourly step bars */}
                    <div className="movement-metric-footer">
                        <div className="movement-hour-bars">
                            {hourBars.map(b => (
                                <div
                                    key={b.h}
                                    className="movement-hour-bar"
                                    style={{ height: `${Math.round((b.v / maxV) * 28)}px` }}
                                />
                            ))}
                        </div>
                        <div className="movement-hour-labels">
                            {hourBars.map(b => (
                                <span key={b.h} className="movement-hour-label">{b.h}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Active Time Box */}
                <div className="movement-metric-box">
                    <div className="movement-metric-main">
                        <div className="movement-active-icon-wrapper">
                            <Flame size={22} className="movement-flame-icon" />
                        </div>
                        <div className="movement-metric-details">
                            <p className="movement-metric-label">Active Time</p>
                            <p className="movement-metric-value">1h 49m</p>
                            <p className="movement-metric-sub">{caloriesBurned.toLocaleString()} kcal burned</p>
                        </div>
                    </div>

                    {/* HR Zone breakdown */}
                    <div className="movement-metric-footer">
                        <div className="movement-zones-list">
                            {hrZones.map(z => (
                                <div key={z.zone} className="movement-zone-row">
                                    <span className="movement-zone-label">{z.zone}</span>
                                    <div className="movement-zone-track">
                                        <div
                                            className={`movement-zone-fill ${z.colorClass}`}
                                            style={{ width: `${z.pct}%` }}
                                        />
                                    </div>
                                    <span className="movement-zone-pct">{z.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gym Workout card */}
            <div className="movement-gym-box">
                <div className="movement-gym-header">
                    <div className="movement-gym-title-group">
                        <div className="movement-gym-icon-wrapper">
                            <Dumbbell size={14} className="movement-dumbbell-icon" />
                        </div>
                        <div className="movement-gym-titles">
                            <span className="movement-gym-title">Gym Workouts</span>
                            <span className="movement-gym-total">{totalGymMinutes}m total</span>
                        </div>
                    </div>
                    <span className="movement-gym-badge">
                        This Week · {activeSessions} sessions
                    </span>
                </div>

                <div className="movement-gym-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={gymWorkoutData} barSize={22} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #27272a)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--chart-axis, #52525b)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--chart-axis, #52525b)" fontSize={11} tickLine={false} axisLine={false} unit="m" />
                            <Tooltip
                                cursor={{ fill: 'rgba(39, 39, 42, 0.35)', radius: 4 }}
                                contentStyle={{
                                    backgroundColor: 'var(--bg-card-solid, #18181b)',
                                    borderColor: 'var(--border-color, #27272a)',
                                    borderRadius: '8px',
                                    fontSize: 12,
                                    color: 'var(--text-main, #fafafa)'
                                }}
                                formatter={(v: any) => [`${v} min`, 'Duration']}
                            />
                            <Bar dataKey="mins" radius={[4, 4, 0, 0]}>
                                {gymWorkoutData.map((entry, i) => (
                                    <Cell
                                        key={i}
                                        fill={entry.active ? '#a78bfa' : entry.mins > 0 ? '#6d28d9' : 'var(--chart-bar-inactive, #27272a)'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
