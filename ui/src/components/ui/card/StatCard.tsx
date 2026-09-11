import type { ReactNode } from 'react';
import './StatCard.css';

export interface StatCardProps {
    icon: ReactNode;
    label: string;
    value: string;
    subValue: string;
    badgeColorClass?: string;
    className?: string;
}

export default function StatCard({
    icon,
    label,
    value,
    subValue,
    badgeColorClass = '',
    className = ''
}: StatCardProps) {
    return (
        <div className={`overview-stat-card ${className}`}>
            <div className="overview-stat-header">
                <div className={`overview-stat-icon ${badgeColorClass}`}>
                    {icon}
                </div>
                <span className="overview-stat-label">{label}</span>
            </div>
            <div className="overview-stat-body">
                <div className="overview-stat-value">{value}</div>
                <div className="overview-stat-subvalue">{subValue}</div>
            </div>
        </div>
    );
}
