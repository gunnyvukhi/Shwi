import { useState } from 'react';
import './Dashbroad.css';
import {
    TrendingDown,
    TrendingUp,
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
import SleepCard from '../../components/ui/card/SleepCard';
import HeartRateCard from '../../components/ui/card/HeartRateCard';
import NutritionMiniCard from '../../components/ui/card/NutritionMiniCard';
import ActivityChart from '../../components/ui/chart/ActivityChart';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import {
    type WeightItem,
} from '../../services/userService';

import { updateUserField } from '../../types/user';

export default function Dashboard() {
    const { t, language } = useLanguage();
    const user = useAuthStore((state: any) => state.user);
    const updateUser = useAuthStore((state: any) => state.updateUser);
    // const [goalModalOpen, setGoalModalOpen] = useState(false);

    const [dashbroadData, setDashbroadData] = useState(user);

    // Temp / Fallback Data
    const currentDate = language === 'vi'
        ? new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).replace('tháng', 'Tháng')
        : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    // Greeting helper
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('dashboard.greetingMorning');
        if (hour >= 12 && hour < 17) return t('dashboard.greetingAfternoon');
        if (hour >= 17 && hour < 22) return t('dashboard.greetingEvening');
        return t('dashboard.greetingNight');
    };
    const greetingText = getGreeting();
    const displayName = dashbroadData?.profile?.fullName?.split(' ').pop()
        || dashbroadData?.name?.split(' ').pop()
        || '';

    // theme
    const isDarkTheme = useThemeStore((state) => state.isDarkTheme);

    const targetWeight = dashbroadData?.profile?.targetWeight ?? dashbroadData?.metrics?.weight ?? 70;
    const currentWeight = dashbroadData?.metrics?.weight ?? 70;
    // Circle progress: clamp between 0-100%
    const weightCircleRadius = 45;
    const weightCircleCircumference = 2 * Math.PI * weightCircleRadius;
    const weightProgress = targetWeight > 0 ? Math.min(1, currentWeight / targetWeight) : 0;
    const weightDashOffset = weightCircleCircumference * (1 - weightProgress);

    const [weightDataMonth] = useState<WeightItem[]>(() => {
        if (user?.weightHistory && user.weightHistory.length > 0) {
            return user.weightHistory;
        }
        return [
            { month: '--/--', weight: 70 }, { month: '--/--', weight: 70 }, { month: '--/--', weight: 70 },
            { month: '--/--', weight: 70 }, { month: '--/--', weight: 70 }, { month: '--/--', weight: 70 },
        ];
    });



    // 3. Handle saving Target & Goal with Optimistic UI + SessionStorage + Silent Background PUT Request
    const handleSaveGoal = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // A. Immediately update UI state and close modal (Zero delay)
        // setGoalModalOpen(false);
        const updatedUser = updateUserField(dashbroadData, e.target.name, e.target.value)
        setDashbroadData(updatedUser);
        // B. Immediately update sessionStorage
        try {
            updateUser(updatedUser);
        } catch (e) {
            console.warn('[Dashboard] Error updating sessionStorage:', e);
        }

        // C. Send background PUT request to API ngầm (No page refresh)
        // try {
        //     await userService.updateProfile({
        //         targetWeight: newTarget,
        //         fitnessGoal: newGoal
        //     });
        //     console.log('[Dashboard] Target updated in background successfully.');
        // } catch (err) {
        //     console.error('[Dashboard Error] Failed to update target in background:', err);
        // }
    };
    handleSaveGoal;
    return (
        <div
            className={`app-wrapper dashboard-app-wrapper ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}
            style={getThemeStyles(isDarkTheme)}
        >
            <Header />

            {/* Main Content */}
            <main>
                <div className="page-header">
                    {/* Left: Greeting */}
                    <div className="greeting-banner">
                        <h1 className="greeting-heading">
                            {greetingText}{displayName ? `, ${displayName}` : ''}!
                        </h1>
                    </div>

                    {/* Right: Date */}
                    <p className="page-date page-date--right">{currentDate}</p>
                </div>

                {/* Stats Grid */}
                <div className="dashboard-stats-grid">
                    {/* Movement card — 3/5 width */}
                    <div className="stats-grid-movement">
                        <MovementCard />
                    </div>
                    {/* Right stacked — 2/5 width */}
                    <div className="stats-grid-side">
                        <HeartRateCard UserID={user?.id} />
                        <SleepCard sleep={user?.sleep} />
                        <NutritionMiniCard nutrition={user?.nutrition} />
                    </div>
                </div>

                {/* Section Divider */}
                <div className="section-divider" aria-hidden="true">
                    <span className="section-divider-label">{t('dashboard.chartsSection')}</span>
                    <span className="section-divider-line" />
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
                                    <div className="goal-status" style={{ color: currentWeight <= targetWeight ? '#10b981' : 'var(--primary)' }}>
                                        {currentWeight <= targetWeight
                                            ? <TrendingDown size={15} aria-hidden="true" />
                                            : <TrendingUp size={15} aria-hidden="true" />}
                                        <span>{t('dashboard.targetWeight')}: {targetWeight} kg</span>
                                    </div>
                                </div>
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
                                <div className="circle-widget" aria-label={`${currentWeight} kg`}>
                                    <svg viewBox="0 0 100 100" className="circle-svg">
                                        <circle cx="50" cy="50" r="45" className="circle-bg" />
                                        <circle
                                            cx="50" cy="50" r="45"
                                            className="circle-progress"
                                            strokeDasharray={weightCircleCircumference}
                                            strokeDashoffset={weightDashOffset}
                                        />
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
            {/* {goalModalOpen && (
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
                                    className={`goal-toggle-btn ${targetWeight[1] === 1 ? 'active-lose' : ''}`}
                                    onClick={() => setTargetWeight([targetWeight[0], 1])}
                                >
                                    {t('dashboard.loseWeight')}
                                </button>
                                <button
                                    className={`goal-toggle-btn ${targetWeight[1] === 0 ? 'active-gain' : ''}`}
                                    onClick={() => setTargetWeight([targetWeight[0], 0])}
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
                                value={targetWeight[0]}
                                onChange={(e) => setTargetWeight([Number(e.target.value), targetWeight[1]])}
                            />
                        </div>

                        <button className="btn-primary" onClick={handleSaveGoal}>
                            {t('dashboard.saveChanges')}
                        </button>
                    </div>
                </div>
            )} */}

            {/* Mobile Bottom Nav */}
            <MobileNav activeNav="dashboard" />
        </div>
    );
}
