import { useState } from 'react';
import './ActivityChart.css';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { useLanguage } from '../../../context/LanguageContext';
import type { ActivityItem } from '../../../services/userService';

// Dữ liệu mặc định cho biểu đồ (Tạm thời)
const defaultActivityDataDay: ActivityItem[] = [
    { time: '6AM', cal: 0 }, { time: '8AM', cal: 200 }, { time: '10AM', cal: 310 }, { time: '12PM', cal: 450 },
    { time: '2PM', cal: 600 }, { time: '4PM', cal: 750 }, { time: '6PM', cal: 900 }, { time: '8PM', cal: 110 }, { time: '10PM', cal: 0 },
];

const defaultActivityDataWeek: ActivityItem[] = [
    { time: 'Mon', cal: 2000 }, { time: 'Tue', cal: 2100 }, { time: 'Wed', cal: 2200 },
    { time: 'Thu', cal: 2300 }, { time: 'Fri', cal: 2400 }, { time: 'Sat', cal: 2500 }, { time: 'Sun', cal: 2000 },
];

// Lọc dữ liệu (ngày, tuần, tháng)
type ActivityFilter = 'Day' | 'Week';

interface ActivityChartProps {
    activityDataDay?: ActivityItem[];
    activityDataWeek?: ActivityItem[];
    filter?: ActivityFilter;
    onFilterChange?: (filter: ActivityFilter) => void;
    className?: string;
}

export default function ActivityChart(
    {
        activityDataDay = defaultActivityDataDay,
        activityDataWeek = defaultActivityDataWeek,
        filter: controlledFilter,
        onFilterChange,
        className = ''
    }: ActivityChartProps) {
    const { t } = useLanguage();

    // Quản lý trạng thái filter
    const [internalFilter, setInternalFilter] = useState<ActivityFilter>('Day');

    const activeFilter = controlledFilter !== undefined ? controlledFilter : internalFilter;

    const handleFilterClick = (newFilter: ActivityFilter) => {
        if (onFilterChange) {
            onFilterChange(newFilter);
        }
        setInternalFilter(newFilter);
    };


    // Xử lí dữ liệu: từ dữ liệu raw -> dữ liệu filter theo ngày, tuần, tháng
    let activeData: ActivityItem[] = [];
    if (activeFilter === 'Day') {
        activeData = activityDataDay
    }
    else {
        activeData = activityDataWeek
    }


    const getFilterLabel = (f: ActivityFilter) => {
        if (f === 'Day') return t('dashboard.day');
        return t('dashboard.week');
    };

    return (
        <div className={`activity-chart-panel card-panel ${className}`.trim()}>
            <div className="activity-chart-header card-header">
                <div>
                    <h2 className="activity-chart-title card-title">
                        {t('dashboard.activityBurnTitle')}{' '}
                        <span className="text-primary">{t('dashboard.activityBurnHighlight')}</span>
                    </h2>
                    <p className="activity-chart-subtitle card-subtitle">{t('dashboard.activityBurnSub')}</p>
                </div>
                <div className="activity-filter-pills filter-pills">
                    {(['Day', 'Week'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => handleFilterClick(f)}
                            className={`activity-filter-btn filter-btn ${activeFilter === f ? 'active' : ''}`}
                            type="button"
                        >
                            {getFilterLabel(f)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="activity-chart-container chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
                        <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--chart-text)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--bg-card-solid)',
                                borderColor: 'var(--border-color)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                            itemStyle={{ color: 'var(--primary)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="cal"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
