import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';
import {
  Activity,
  Utensils,
  Dumbbell,
  ArrowRight,
  Menu,
  X,
  Calendar,
  CheckCircle2,
  Users,
  Sun,
  Moon,
  Flame,
  UserCheck
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  ResponsiveContainer
} from 'recharts';
import { getThemeStyles } from '../../config/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { PATHS } from '../../routes/paths';
import LanguageToggle from '../../components/ui/button/LanguageToggle';
import ShwiIcon from '../../components/ui/icon/ShwiIcon';

const mockActivityData = [
  { day: 'Mon', active: 300 },
  { day: 'Tue', active: 450 },
  { day: 'Wed', active: 380 },
  { day: 'Thu', active: 520 },
  { day: 'Fri', active: 400 },
  { day: 'Sat', active: 700 },
  { day: 'Sun', active: 650 },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Synchronized theme state matching Dashboard page
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

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Trainer booking placeholder modal state
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

  // Interactive Workout Demo sets state
  const [completedSets, setCompletedSets] = useState<boolean[]>([true, true, false]);

  const toggleSetCompleted = (index: number) => {
    setCompletedSets((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const handleNavClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePrimaryCta = () => {
    if (isAuthenticated) {
      navigate(PATHS.DASHBOARD);
    } else {
      navigate(PATHS.REGISTER);
    }
  };

  const handleLoginClick = () => {
    if (isAuthenticated) {
      navigate(PATHS.DASHBOARD);
    } else {
      navigate(PATHS.LOGIN);
    }
  };

  return (
    <div
      className={`app-wrapper home-app-wrapper ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}
      style={getThemeStyles(isDarkTheme)}
    >
      {/* Navigation Header */}
      <nav className="home-nav">
        <div className="home-nav-container">
          {/* Logo */}
          <ShwiIcon size={20} />

          {/* Desktop Navigation Links */}
          <div className="home-nav-links">
            <a
              href="#features"
              className="home-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('features');
              }}
            >
              {t('home.navFeatures')}
            </a>
            <a
              href="#how-it-works"
              className="home-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('how-it-works');
              }}
            >
              {t('home.navHowItWorks')}
            </a>
            <a
              href="#coaching"
              className="home-nav-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('coaching');
              }}
            >
              {t('home.navCoaching')}
            </a>
          </div>

          {/* Header Action Buttons */}
          <div className="home-nav-actions">
            {/* Language Toggle */}
            <LanguageToggle />

            {/* Theme Switch Button */}
            <button
              onClick={handleToggleTheme}
              className="home-icon-btn"
              aria-label="Toggle Theme"
              title={isDarkTheme ? t('nav.lightMode') : t('nav.darkMode')}
            >
              {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Log In / Dashboard button */}
            <button className="home-login-btn" onClick={handleLoginClick}>
              {isAuthenticated ? t('home.dashboardBtn') : t('home.loginBtn')}
            </button>

            {/* Sign Up button */}
            {!isAuthenticated && (
              <button className="home-signup-btn" onClick={() => navigate(PATHS.REGISTER)}>
                {t('home.signUpBtn')}
              </button>
            )}
          </div>

          {/* Mobile Menu & Theme Toggles */}
          <div className="home-mobile-toggle">
            <LanguageToggle variant="icon" />
            <button onClick={handleToggleTheme} className="home-icon-btn">
              {isDarkTheme ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className="home-icon-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="home-mobile-drawer">
            <a
              href="#features"
              className="home-mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('features');
              }}
            >
              {t('home.navFeatures')}
            </a>
            <a
              href="#how-it-works"
              className="home-mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('how-it-works');
              }}
            >
              {t('home.navHowItWorks')}
            </a>
            <a
              href="#coaching"
              className="home-mobile-link"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('coaching');
              }}
            >
              {t('home.navCoaching')}
            </a>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className="home-cta-primary" style={{ flex: 1 }} onClick={handleLoginClick}>
                {isAuthenticated ? t('home.dashboardBtn') : t('home.loginBtn')}
              </button>
              {!isAuthenticated && (
                <button className="home-cta-secondary" style={{ flex: 1 }} onClick={() => navigate(PATHS.REGISTER)}>
                  {t('home.signUpBtn')}
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main>
        <section className="home-hero">
          <div className="home-hero-glow" />

          <div className="home-hero-container">
            <h1 className="home-hero-title">
              {t('home.heroTitle1')}{' '}
              <span className="home-hero-title-highlight">{t('home.heroTitle2')}</span>
            </h1>

            <p className="home-hero-subtitle">
              {t('home.heroSubtitle')}
            </p>

            <div className="home-hero-actions">
              <button className="home-cta-primary" onClick={handlePrimaryCta}>
                {isAuthenticated ? t('home.dashboardBtn') : t('home.startTrainingBtn')}
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="home-hero-stats">
              <div>
                <div className="home-stat-num">{t('home.statsAthletes')}</div>
                <div className="home-stat-label">{t('home.statsAthletesLabel')}</div>
              </div>
              <div>
                <div className="home-stat-num">{t('home.statsPrograms')}</div>
                <div className="home-stat-label">{t('home.statsProgramsLabel')}</div>
              </div>
              <div>
                <div className="home-stat-num">{t('home.statsSatisfaction')}</div>
                <div className="home-stat-label">{t('home.statsSatisfactionLabel')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Mockup Section */}
        <section className="home-mockup-section">
          <div className="home-mockup-card">
            <div className="home-mockup-header">
              <div className="home-mockup-dots">
                <span className="home-dot home-dot-red" />
                <span className="home-dot home-dot-yellow" />
                <span className="home-dot home-dot-green" />
              </div>
              <div className="home-mockup-url">
                app.shwi.fit/dashboard
              </div>
            </div>

            <div className="home-mockup-body">
              <div className="home-mockup-grid">
                <div className="home-mock-widget">
                  <div className="home-mock-widget-title">Active Burn</div>
                  <div className="home-mock-widget-val" style={{ color: 'var(--primary)' }}>
                    650 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kcal</span>
                  </div>
                </div>
                <div className="home-mock-widget">
                  <div className="home-mock-widget-title">Recovery Index</div>
                  <div className="home-mock-widget-val" style={{ color: '#818cf8' }}>
                    92<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>%</span>
                  </div>
                </div>
                <div className="home-mock-widget">
                  <div className="home-mock-widget-title">Weekly Volume</div>
                  <div className="home-mock-widget-val" style={{ color: '#f43f5e' }}>
                    14,250 <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>kg</span>
                  </div>
                </div>
              </div>

              <div style={{ height: 200, marginTop: '1.5rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockActivityData}>
                    <defs>
                      <linearGradient id="colorActiveHome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="var(--chart-text)" />
                    <Area
                      type="monotone"
                      dataKey="active"
                      stroke="var(--primary)"
                      strokeWidth={3}
                      fill="url(#colorActiveHome)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section id="features" className="home-features-section">
          <div className="home-section-header">
            <h2 className="home-section-title">
              {t('home.featuresHeadingTitle')}{' '}
              <span className="home-hero-title-highlight">{t('home.featuresHeadingHighlight')}</span>
            </h2>
            <p className="home-section-subtitle">
              {t('home.featuresSubtitle')}
            </p>
          </div>

          <div className="home-features-grid">
            <FeatureCard
              icon={<Dumbbell size={24} />}
              title={t('home.feature1Title')}
              description={t('home.feature1Desc')}
            />
            <FeatureCard
              icon={<Utensils size={24} />}
              title={t('home.feature2Title')}
              description={t('home.feature2Desc')}
            />
            <FeatureCard
              icon={<Activity size={24} />}
              title={t('home.feature3Title')}
              description={t('home.feature3Desc')}
            />
            <FeatureCard
              icon={<Flame size={24} />}
              title={t('home.feature4Title')}
              description={t('home.feature4Desc')}
            />
          </div>
        </section>

        {/* Detailed Features Deep Dive */}
        <section id="how-it-works" className="home-deepdive-section">
          {/* Feature 1 */}
          <div className="home-deepdive-row">
            <div className="home-deepdive-info">
              <div className="home-deepdive-badge">
                <Dumbbell size={22} />
              </div>
              <h3 className="home-deepdive-title">{t('home.featureWorkoutTitle')}</h3>
              <p className="home-deepdive-desc">{t('home.featureWorkoutDesc')}</p>
            </div>
            <div className="home-deepdive-visual">
              <div className="home-interactive-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontWeight: 'bold' }}>
                  <span>Bench Press</span>
                  <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>3 Sets Recorded</span>
                </div>
                {[1, 2, 3].map((setNum, idx) => (
                  <div
                    key={setNum}
                    className="home-set-row"
                    onClick={() => toggleSetCompleted(idx)}
                  >
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Set {setNum}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', fontFamily: 'monospace' }}>
                      <span>100 <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>kg</span></span>
                      <span>8 <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>reps</span></span>
                      <CheckCircle2
                        size={18}
                        className={`home-set-check ${completedSets[idx] ? '' : 'inactive'}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="home-deepdive-row reverse">
            <div className="home-deepdive-info">
              <div className="home-deepdive-badge" style={{ backgroundColor: 'rgba(129, 140, 248, 0.15)', color: '#818cf8' }}>
                <Utensils size={22} />
              </div>
              <h3 className="home-deepdive-title">{t('home.featureDietTitle')}</h3>
              <p className="home-deepdive-desc">{t('home.featureDietDesc')}</p>
            </div>
            <div className="home-deepdive-visual">
              <div className="home-interactive-card" style={{ display: 'flex', gap: '1rem', height: '220px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ height: '70%', background: 'rgba(56, 189, 248, 0.3)', borderRadius: '4px', position: 'relative' }}>
                    <div style={{ height: '50%', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--text-muted)' }}>PROTEIN</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ height: '90%', background: 'rgba(129, 140, 248, 0.3)', borderRadius: '4px', position: 'relative' }}>
                    <div style={{ height: '60%', background: '#818cf8', borderRadius: '4px 4px 0 0' }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--text-muted)' }}>CARBS</div>
                </div>
                <div style={{ flex: 1, background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.75rem', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ height: '50%', background: 'rgba(244, 63, 94, 0.3)', borderRadius: '4px', position: 'relative' }}>
                    <div style={{ height: '80%', background: '#f43f5e', borderRadius: '4px 4px 0 0' }} />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '0.5rem', color: 'var(--text-muted)' }}>FATS</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PT Coaching Section */}
        <section id="coaching" className="home-coaching-section">
          <div className="home-coaching-box">
            <div className="home-coaching-content">
              <div className="home-coaching-badge">
                <Users size={16} /> {t('home.coachingBadge')}
              </div>
              <h2 className="home-coaching-title">
                {t('home.coachingTitle1')}<br />{t('home.coachingTitle2')}
              </h2>
              <p className="home-coaching-desc">
                {t('home.coachingDesc')}
              </p>
              <div className="home-coaching-actions">
                <button
                  className="home-cta-primary"
                  onClick={() => setBookingModalOpen(true)}
                >
                  <Calendar size={18} />
                  {t('home.bookSessionBtn')}
                </button>
                <button
                  className="home-cta-secondary"
                  onClick={() => setBookingModalOpen(true)}
                >
                  {t('home.browseTrainersBtn')}
                </button>
              </div>
            </div>

            <div className="home-trainer-grid">
              {['Sarah', 'Marcus', 'Elena', 'David'].map((name, i) => (
                <div
                  key={name}
                  className="home-trainer-card"
                  onClick={() => setBookingModalOpen(true)}
                >
                  <img
                    src={`https://i.pravatar.cc/150?img=${11 + i}`}
                    alt={name}
                    className="home-trainer-avatar"
                  />
                  <div>
                    <div className="home-trainer-name">Coach {name}</div>
                    <div className="home-trainer-role">Strength & Conditioning</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Placeholder Booking Modal */}
        {bookingModalOpen && (
          <div className="home-modal-overlay" onClick={() => setBookingModalOpen(false)}>
            <div className="home-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="home-modal-icon">
                <UserCheck size={28} />
              </div>
              <h3 className="home-modal-title">{t('home.trainerBookingPlaceholderTitle')}</h3>
              <p className="home-modal-msg">{t('home.trainerBookingPlaceholderMsg')}</p>
              <button
                className="home-modal-close-btn"
                onClick={() => setBookingModalOpen(false)}
              >
                {t('home.close')}
              </button>
            </div>
          </div>
        )}
        {/* CTA Banner Section */}
        <section className="home-cta-section">
          <div className="home-cta-card">
            <div className="home-cta-card-glow" />
            <h2 className="home-cta-title">{t('home.ctaTitle')}</h2>
            <p className="home-cta-subtitle">{t('home.ctaSubtitle')}</p>
            <div className="home-cta-btn-wrap">
              <button className="home-cta-primary" onClick={handlePrimaryCta}>
                {isAuthenticated ? t('home.dashboardBtn') : t('home.ctaButton')}
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="home-footer-container">
          <div className="home-footer-grid">
            {/* Brand Column */}
            <div className="home-footer-brand-col">
              <ShwiIcon size={20} />
              <p className="home-footer-tagline">
                {t('home.footerTagline')}
              </p>
            </div>

            {/* Product Column */}
            <div className="home-footer-col">
              <h4 className="home-footer-col-title">{t('home.footerProduct')}</h4>
              <ul className="home-footer-list">
                <li><a href="#features" className="home-footer-link" onClick={(e) => { e.preventDefault(); handleNavClick('features'); }}>{t('home.navFeatures')}</a></li>
                <li><a href="#how-it-works" className="home-footer-link" onClick={(e) => { e.preventDefault(); handleNavClick('how-it-works'); }}>{t('home.navHowItWorks')}</a></li>
                <li><a href="#coaching" className="home-footer-link" onClick={(e) => { e.preventDefault(); handleNavClick('coaching'); }}>{t('home.navCoaching')}</a></li>
              </ul>
            </div>

            {/* Resources Column */}
            <div className="home-footer-col">
              <h4 className="home-footer-col-title">{t('home.footerResources')}</h4>
              <ul className="home-footer-list">
                <li><a href="#" className="home-footer-link" onClick={(e) => e.preventDefault()}>{t('home.support')}</a></li>
                <li><a href="#" className="home-footer-link" onClick={(e) => e.preventDefault()}>{t('home.privacyPolicy')}</a></li>
                <li><a href="#" className="home-footer-link" onClick={(e) => e.preventDefault()}>{t('home.termsOfService')}</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="home-footer-col">
              <h4 className="home-footer-col-title">{t('home.footerCompany')}</h4>
              <ul className="home-footer-list">
                <li><a href="#" className="home-footer-link" onClick={(e) => e.preventDefault()}>{t('home.careers')}</a></li>
                <li><a href="#" className="home-footer-link" onClick={handleLoginClick}>{t('home.loginBtn')}</a></li>
                {!isAuthenticated && (
                  <li><a href="#" className="home-footer-link" onClick={() => navigate(PATHS.REGISTER)}>{t('home.signUpBtn')}</a></li>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="home-footer-bottom">
            <div className="home-footer-copy">
              {t('home.footerRights')}
            </div>

            <div className="home-footer-bottom-actions">
              <LanguageToggle />
              <button
                onClick={handleToggleTheme}
                className="home-icon-btn"
                aria-label="Toggle Theme"
                title={isDarkTheme ? t('nav.lightMode') : t('nav.darkMode')}
              >
                {isDarkTheme ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="home-feature-card">
      <div className="home-feature-icon-box">
        {icon}
      </div>
      <h3 className="home-feature-card-title">{title}</h3>
      <p className="home-feature-card-desc">{description}</p>
    </div>
  );
}