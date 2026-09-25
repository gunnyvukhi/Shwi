import { useState } from 'react';
import './MovementCard.css';
import { Flame, Dumbbell } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
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
import { useLanguage } from '../../../context/LanguageContext';
import { parseTimeToMinutes, formatMinutesToHhMm } from '../../../utils/timeUtils';

interface StepsHourlyData {
    distanceKm: number;
    steps: number;
    timeLabel: string;
    timeWalkedMinutes: number;
}

export interface MovementCardProps {
    className?: string;
}

const defaultWorkoutLogs: Record<string, { name: string; time: string }> = {
    Monday: { name: '', time: '0m' },
    Tuesday: { name: '', time: '0m' },
    Wednesday: { name: '', time: '0m' },
    Thursday: { name: '', time: '0m' },
    Friday: { name: '', time: '0m' },
    Saturday: { name: '', time: '0m' },
    Sunday: { name: '', time: '0m' },
};

export default function MovementCard({
    className = ''
}: MovementCardProps) {
    const { t } = useLanguage();
    const [hoveredStepIndex, setHoveredStepIndex] = useState<number | null>(null);

    const user = useAuthStore((state: any) => state.user);
    const stepsGoal = user?.profile?.targetSteps || 0;
    const stepsCurrent = user?.steps?.totalSteps || 0;

    const stepsPct = stepsGoal > 0 ? Math.min(100, Math.round((stepsCurrent / stepsGoal) * 100)) : 0;
    const stepsData: StepsHourlyData[] = user?.steps?.intervals;
    const maxSteps = stepsData.length > 0 ? Math.max(...stepsData.map(b => b.steps), 1) : 1;

    // Process workoutLogs data: nếu có dữ liệu ngày đó trong workoutLogs thì dùng, ngược lại dùng mặc định
    const rawWorkoutLogs: Record<string, { name: string; time: string }> = Object.keys(defaultWorkoutLogs).reduce((acc, day) => {
        acc[day] = user?.workoutLogs?.[day] || defaultWorkoutLogs[day];
        return acc;
    }, {} as Record<string, { name: string; time: string }>);

    const workoutChartData = Object.entries(rawWorkoutLogs).map(([fieldKey, item]: [string, any]) => {
        const mins = parseTimeToMinutes(item?.time || '');
        return {
            day: t(`common.${fieldKey.toLowerCase()}`),
            name: item?.name || '',
            time: item?.time ? (formatMinutesToHhMm(mins) || item.time) : formatMinutesToHhMm(mins),
            mins,
        };
    });

    const totalGymMinutes = workoutChartData.reduce((acc, curr) => acc + curr.mins, 0);
    const activeSessions = workoutChartData.filter(d => d.mins > 0).length;

    const hrZones = [
        { zone: 'Peak', pct: 18, colorClass: 'movement-zone-peak' },
        { zone: 'Cardio', pct: 42, colorClass: 'movement-zone-cardio' },
        { zone: 'Fat Burn', pct: 40, colorClass: 'movement-zone-fatburn' },
    ];

    return (
        <div className={`movement-card ${className}`}>
            {/* Header */}
            <div className="movement-header">
                <span className="movement-title">{t('dashboard.movement')}</span>
                <span className="movement-today-tag">{t('common.today')}</span>
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
                                <span className="movement-ring-text">{stepsPct || '--'}%</span>
                            </div>
                        </div>
                        <div className="movement-metric-details">
                            <p className="movement-metric-label">{t('dashboard.steps')}</p>
                            <p className="movement-metric-value">{stepsCurrent.toLocaleString()}</p>
                            <p className="movement-metric-sub">{t('dashboard.stepGoal', { val: stepsGoal.toLocaleString() })}</p>
                        </div>
                    </div>

                    {/* Hourly step bars */}
                    <div className="movement-metric-footer">
                        <div className="movement-hour-bars-wrap">
                            <div className="movement-hour-bars">
                                {stepsData.map((b, index) => {
                                    const heightPx = Math.max(3, Math.round((b.steps / maxSteps) * 28));
                                    const isHovered = hoveredStepIndex === index;
                                    return (
                                        <div
                                            key={b.timeLabel || index}
                                            className={`movement-hour-col ${isHovered ? 'hovered' : ''}`}
                                            onMouseEnter={() => setHoveredStepIndex(index)}
                                            onMouseLeave={() => setHoveredStepIndex(null)}
                                        >
                                            <div
                                                className="movement-hour-bar"
                                                style={{ height: `${heightPx}px` }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Tooltip on hover */}
                            {hoveredStepIndex !== null && stepsData[hoveredStepIndex] && (
                                <div
                                    className="movement-hour-tooltip"
                                    style={{
                                        left: `${((hoveredStepIndex + 0.5) / stepsData.length) * 100}%`,
                                        transform:
                                            hoveredStepIndex === 0
                                                ? 'translate(-15%, -100%)'
                                                : hoveredStepIndex === stepsData.length - 1
                                                    ? 'translate(-85%, -100%)'
                                                    : 'translate(-50%, -100%)',
                                    }}
                                >
                                    <div className="movement-hour-tooltip-time">
                                        {stepsData[hoveredStepIndex].timeLabel}
                                    </div>
                                    <div className="movement-hour-tooltip-body">
                                        <div className="movement-hour-tooltip-row">
                                            <span className="tooltip-label">{t('dashboard.steps')}:</span>
                                            <span className="tooltip-val highlight-steps">
                                                {stepsData[hoveredStepIndex].steps.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="movement-hour-tooltip-row">
                                            <span className="tooltip-label">{t('common.distance')}:</span>
                                            <span className="tooltip-val">
                                                {stepsData[hoveredStepIndex].distanceKm ?? '--'} km
                                            </span>
                                        </div>
                                        <div className="movement-hour-tooltip-row">
                                            <span className="tooltip-label">{t('common.time')}:</span>
                                            <span className="tooltip-val highlight-time">
                                                {stepsData[hoveredStepIndex].timeWalkedMinutes
                                                    ? formatMinutesToHhMm(stepsData[hoveredStepIndex].timeWalkedMinutes)
                                                    : '--'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="movement-hour-labels">
                            {stepsData.map((b, idx) => (
                                <span
                                    key={b.timeLabel || idx}
                                    className={`movement-hour-label ${hoveredStepIndex === idx ? 'active' : ''}`}
                                >
                                    {b.timeLabel || '--'}
                                </span>
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
                            <p className="movement-metric-label">{t('dashboard.estCaloriesBurnt')}</p>
                            <p className="movement-metric-value">---- Kcal</p>
                            <p className="movement-metric-sub">{t('dashboard.endOfTheDay')}</p>
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
                                    <span className="movement-zone-pct">{`${z.pct > 0 ? z.pct : '--'}%`}</span>
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
                            <span className="movement-gym-title">{t('dashboard.gymWorkouts')}</span>
                            <span className="movement-gym-total">{t('dashboard.totalGymTime', { val: formatMinutesToHhMm(totalGymMinutes) })}</span>
                        </div>
                    </div>
                    <span className="movement-gym-badge">
                        {t('dashboard.thisWeekSessions', { val: activeSessions })}
                    </span>
                </div>

                <div className="movement-gym-chart-container">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={workoutChartData} barSize={22} margin={{ top: 8, right: 6, left: -14, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid, #27272a)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--chart-axis, #52525b)" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="var(--chart-axis, #52525b)"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                width={44}
                                tickFormatter={formatMinutesToHhMm}
                            />
                            <Tooltip
                                content={<CustomWorkoutTooltip />}
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
                                {workoutChartData.map((entry, i) => (
                                    <Cell
                                        key={i}
                                        fill={entry.mins >= 60 ? '#a78bfa' : entry.mins > 0 ? '#6d28d9' : 'var(--chart-bar-inactive, #27272a)'}
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


interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

const CustomWorkoutTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    const { t } = useLanguage();
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div style={{
                backgroundColor: 'var(--bg-card-solid, #18181b)',
                border: '1px solid var(--border-color, #27272a)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--text-main, #fafafa)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                maxWidth: '220px'
            }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted, #a1a1aa)', marginBottom: '4px', fontWeight: 600 }}>
                    {label}
                </div>
                <div style={{ fontWeight: 600, color: '#a78bfa', marginBottom: '4px', wordBreak: 'break-word' }}>
                    {data.name || t('dashboard.Resting')}
                </div>
                {
                    data.time && data.time !== '0m' && (
                        <div style={{ color: 'var(--text-main, #fafafa)', fontSize: '11px' }}>
                            {t('common.time')}: <span style={{ fontWeight: 600, color: '#38bdf8' }}>{data.time}</span>
                        </div>
                    )
                }
            </div>
        );
    }
    return null;
};