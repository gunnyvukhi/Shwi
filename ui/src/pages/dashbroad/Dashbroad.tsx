import './Dashbroad.css';
import Header from '../../components/layout/Header';
import MobileNav from '../../components/layout/MobileNav';
import { getThemeStyles } from '../../config/theme';
import FullBodyMuscles from '../../components/ui/FullBodyMuscles/FullBodyMuscles';
import { useLanguage } from '../../context/LanguageContext';
import MovementCard from '../../components/ui/card/MovementCard';
import SleepCard from '../../components/ui/card/SleepCard';
import HeartRateCard from '../../components/ui/card/HeartRateCard';
import NutritionMiniCard from '../../components/ui/card/NutritionMiniCard';
import ActivityChart from '../../components/ui/chart/ActivityChart';
import WeightCard from '../../components/ui/card/WeightCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

export default function Dashboard() {
    const { t, language } = useLanguage();
    const user = useAuthStore((state: any) => state.user);

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
    const displayName = user?.profile?.name?.split(' ').pop() || '';

    // theme
    const isDarkTheme = useThemeStore((state) => state.isDarkTheme);

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

                {/* Charts & Body Layout */}
                <div className="main-grid">
                    <div className="charts-col">

                        {/* Activity Chart */}
                        <ActivityChart />

                        {/* Weight Progress Card */}
                        <WeightCard />

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

            {/* Mobile Bottom Nav */}
            <MobileNav activeNav="dashboard" />
        </div>
    );
}
