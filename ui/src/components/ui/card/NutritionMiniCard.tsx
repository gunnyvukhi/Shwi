import './NutritionMiniCard.css';
import { Utensils, Flame } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export interface NutritionData {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

export interface NutritionMiniCardProps {
    className?: string;
    nutrition?: NutritionData | null;
    caloriesGoal?: number;
    proteinGoal?: number;
    carbsGoal?: number;
    fatGoal?: number;
}

export default function NutritionMiniCard({
    className = '',
    nutrition,
    caloriesGoal = 2400,
    proteinGoal = 160,
    carbsGoal = 250,
    fatGoal = 45,
}: NutritionMiniCardProps) {
    const { t } = useLanguage();

    // Primary Caloric metrics
    const currentCal = Math.max(0, nutrition?.calories || 0);
    const targetCal = Math.max(1, caloriesGoal);
    const remainingCal = targetCal - currentCal;

    // Macro values
    const proteinVal = Math.round(nutrition?.protein ?? 142);
    const carbsVal = Math.round(nutrition?.carbs ?? 210);
    const fatVal = Math.round(nutrition?.fat ?? 58);

    const macros = [
        {
            id: 'protein',
            label: t('dashboard.proteinLabel') || 'Protein',
            current: proteinVal,
            goal: proteinGoal,
            remaining: proteinGoal - proteinVal,
            pct: Math.min(100, Math.round((proteinVal / Math.max(1, proteinGoal)) * 100)),
            dotClass: 'dot-protein',
            barClass: 'bar-protein',
        },
        {
            id: 'carbs',
            label: t('dashboard.carbsLabel') || 'Carbs',
            current: carbsVal,
            goal: carbsGoal,
            remaining: carbsGoal - carbsVal,
            pct: Math.min(100, Math.round((carbsVal / Math.max(1, carbsGoal)) * 100)),
            dotClass: 'dot-carbs',
            barClass: 'bar-carbs',
        },
        {
            id: 'fat',
            label: t('dashboard.fatLabel') || 'Fat',
            current: fatVal,
            goal: fatGoal,
            remaining: fatGoal - fatVal,
            pct: Math.min(100, Math.round((fatVal / Math.max(1, fatGoal)) * 100)),
            dotClass: 'dot-fat',
            barClass: 'bar-fat',
        },
    ];

    return (
        <div className={`nutrition-card ${className}`}>
            {/* Header */}
            <div className="nutrition-header">
                <div className="nutrition-header-main">
                    <div className="nutrition-icon-badge">
                        <Utensils size={20} className="nutrition-icon-utensils" />
                    </div>
                    <div className="nutrition-title-wrap">
                        <span className="nutrition-title">{t('dashboard.nutritionTitle')}</span>
                    </div>
                </div>

                {/* Remaining / Surplus Pill placed in Header */}
                <div className={`nutrition-remaining-pill ${remainingCal < 0 ? 'pill-surplus' : ''}`}>
                    <Flame size={13} className="nutrition-flame-icon" />
                    <span>
                        {remainingCal >= 0
                            ? t('dashboard.caloriesRemaining', { val: remainingCal.toLocaleString() })
                            : t('dashboard.caloriesOver', { val: Math.abs(remainingCal).toLocaleString() })
                        }
                    </span>
                </div>
            </div>

            {/* Main Value Row: Calories In + Target Kcal */}
            <div className="nutrition-metric-row">
                <div className="nutrition-value-group">
                    <span className="nutrition-calories-number">
                        {currentCal.toLocaleString()}
                    </span>
                    <span className="nutrition-unit-label">kcal</span>
                    <span className="nutrition-target-label">
                        / {targetCal.toLocaleString()} kcal
                    </span>
                </div>
            </div>

            {/* Macro Cards: Eaten Today vs Still Needed */}
            <div className="nutrition-macro-cards-grid">
                {macros.map(m => {
                    const isOver = m.remaining < 0;

                    return (
                        <div key={m.id} className="nutrition-macro-card">
                            {/* Card Header: Dot + Label + Goal */}
                            <div className="macro-card-header">
                                <div className="macro-card-title-group">
                                    <span className={`macro-card-dot ${m.dotClass}`} />
                                    <span className="macro-card-label">{m.label}</span>
                                </div>
                                <span className="macro-card-goal">/{m.goal}g</span>
                            </div>

                            {/* Consumed Amount */}
                            <div className="macro-card-main">
                                <span className="macro-card-current">{m.current}</span>
                                <span className="macro-card-unit">g</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="macro-card-track" aria-hidden="true">
                                <div
                                    className={`macro-card-bar ${m.barClass} ${isOver ? 'bar-over' : ''}`}
                                    style={{ width: `${m.pct}%` }}
                                />
                            </div>

                            {/* Remaining or Over Status */}
                            <div className="macro-card-footer">
                                <span className={`macro-card-remaining ${isOver ? 'text-over' : 'text-left'}`}>
                                    {isOver
                                        ? t('dashboard.macroOver', { val: `${Math.abs(m.remaining)}` })
                                        : t('dashboard.macroLeft', { val: `${m.remaining}` })
                                    }
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
