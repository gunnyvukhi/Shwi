import './NutritionMiniCard.css';
import { Utensils } from 'lucide-react';

export interface NutritionMacro {
    label: string;
    current: number;
    goal: number;
    unit: string;
    colorClass: string;
}

export interface NutritionMiniCardProps {
    className?: string;
    caloriesIn?: number;
    caloriesGoal?: number;
}

export default function NutritionMiniCard({
    className = '',
    caloriesIn = 2150,
    caloriesGoal = 2500
}: NutritionMiniCardProps) {
    const calPct = Math.min(100, Math.round((caloriesIn / caloriesGoal) * 100));

    const macros: NutritionMacro[] = [
        { label: 'Protein', current: 142, goal: 160, unit: 'g', colorClass: 'macro-bar-protein' },
        { label: 'Carbs', current: 210, goal: 260, unit: 'g', colorClass: 'macro-bar-carbs' },
        { label: 'Fat', current: 58, goal: 70, unit: 'g', colorClass: 'macro-bar-fat' },
    ];

    return (
        <div className={`nutrition-card ${className}`}>
            <div className="nutrition-header">
                <div className="nutrition-header-main">
                    <div className="nutrition-icon-badge">
                        <Utensils size={20} />
                    </div>
                    <div>
                        <span className="nutrition-title">Nutrition</span>
                        <p className="nutrition-subtitle">Daily Calorie & Macro Target</p>
                    </div>
                </div>
                <div className="nutrition-stats-right">
                    <div className="nutrition-calories">
                        {caloriesIn.toLocaleString()} <span className="nutrition-goal">/ {caloriesGoal.toLocaleString()} kcal</span>
                    </div>
                    <span className="nutrition-reached-badge">{calPct}% reached</span>
                </div>
            </div>

            {/* Macro bars */}
            <div className="nutrition-macros-grid">
                {macros.map(m => {
                    const pct = Math.min(100, Math.round((m.current / m.goal) * 100));
                    return (
                        <div key={m.label} className="nutrition-macro-item">
                            <div className="nutrition-macro-top">
                                <span className="nutrition-macro-label">{m.label}</span>
                                <span className="nutrition-macro-amount">{m.current}{m.unit}</span>
                            </div>
                            <div className="nutrition-macro-track">
                                <div
                                    className={`nutrition-macro-fill ${m.colorClass}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
