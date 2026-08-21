import React, { useState, useEffect } from 'react';
import './Profile.css';
import Header from '../../components/layout/Header';
import MobileNav from '../../components/layout/MobileNav';
import { getThemeStyles } from '../../config/theme';
import { useLanguage } from '../../context/LanguageContext';
import { useAuthStore } from '../../store/useAuthStore';
import { userService } from '../../services/userService';
import {
  Camera,
  Edit2,
  Calendar,
  Mail,
  Shield,
  User as UserIcon,
  Award,
  Activity,
  Target,
  Scale,
  Ruler,
  Phone,
  X,
  CheckCircle2,
  AlertCircle,
  Flame,
  Trophy,
  Dumbbell,
  Clock,
  ChevronRight,
  Heart,
  Zap,
  Check
} from 'lucide-react';

export default function Profile() {
  const { t } = useLanguage();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    const saved = localStorage.getItem('shwi_theme');
    return saved !== null ? saved === 'dark' : true;
  });

  const [activeTab, setActiveTab] = useState<'overview' | 'workouts' | 'metrics' | 'settings'>('overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState<'avatar' | 'wallpaper' | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State with enriched Athlete Specs
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    fitnessGoal: 'Lose Weight',
    height: 175,
    currentWeight: 70,
    targetWeight: 65,
    gender: 'Male',
    phone: '',
    age: 25,
    experienceLevel: 'Intermediate (2-3 yrs)',
    workoutSplit: 'Push / Pull / Legs (PPL)',
    bodyFat: 14.5,
    rhr: 58
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        fitnessGoal: user.fitnessGoal || 'Lose Weight',
        height: user.height || 175,
        currentWeight: user.currentWeight || 70,
        targetWeight: user.targetWeight || 65,
        gender: user.gender || 'Male',
        phone: user.phone || '',
        age: user.age || 25,
        experienceLevel: user.experienceLevel || 'Intermediate (2-3 yrs)',
        workoutSplit: user.workoutSplit || 'Push / Pull / Legs (PPL)',
        bodyFat: user.bodyFat || 14.5,
        rhr: user.rhr || 58
      });
    }
  }, [user]);

  const handleToggleTheme = () => {
    setIsDarkTheme((prev) => {
      const next = !prev;
      localStorage.setItem('shwi_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'wallpaper') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    try {
      setUploadingMedia(type);
      const res = await userService.uploadMedia(file, type);
      updateUser(res.user);
      showToast('success', t('profile.uploadSuccess'));
    } catch (err: any) {
      showToast('error', err.message || 'Failed to upload image');
    } finally {
      setUploadingMedia(null);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await userService.updateProfile(formData);
      updateUser(updatedUser);
      setEditModalOpen(false);
      showToast('success', t('profile.saveSuccess'));
    } catch (err: any) {
      showToast('error', err.message || t('profile.saveError'));
    }
  };

  // BMI Calculation
  const currentH = formData.height || 175;
  const currentW = formData.currentWeight || 70;
  const bmiVal = (currentW / ((currentH / 100) * (currentH / 100))).toFixed(1);
  const bmiCategory =
    Number(bmiVal) < 18.5 ? 'Underweight' :
    Number(bmiVal) < 25 ? 'Normal Weight' :
    Number(bmiVal) < 30 ? 'Overweight' : 'Obese';

  // BMR Estimate (Mifflin-St Jeor formula)
  const bmrEst = Math.round(10 * currentW + 6.25 * currentH - 5 * formData.age + (formData.gender === 'Male' ? 5 : -161));

  const formattedJoinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Jan 2026';

  const personalBests = [
    { lift: 'Bench Press', weight: '100 kg', date: 'Oct 14, 2026' },
    { lift: 'Barbell Squat', weight: '140 kg', date: 'Oct 02, 2026' },
    { lift: 'Deadlift', weight: '180 kg', date: 'Sep 25, 2026' },
    { lift: 'Overhead Press', weight: '65 kg', date: 'Sep 18, 2026' },
  ];

  const recentWorkouts = [
    { id: 1, name: 'Hypertrophy Chest & Triceps', date: 'Yesterday at 5:30 PM', duration: '65 min', calories: '540 kcal', type: 'Strength' },
    { id: 2, name: 'Leg Day - Quad Focus', date: 'Oct 18, 2026', duration: '75 min', calories: '680 kcal', type: 'Heavy' },
    { id: 3, name: 'Pull & Biceps Mass Builder', date: 'Oct 16, 2026', duration: '58 min', calories: '490 kcal', type: 'Hypertrophy' },
  ];

  const activeGoals = [
    { label: 'Target Body Weight', current: formData.currentWeight, target: formData.targetWeight, unit: 'kg', color: 'rgba(99, 102, 241, 1)' },
    { label: 'Weekly Active Sessions', current: 4, target: 5, unit: 'sessions', color: 'rgba(16, 185, 129, 1)' },
    { label: 'Monthly Calorie Burn', current: 14500, target: 20000, unit: 'kcal', color: 'rgba(245, 158, 11, 1)' },
  ];

  return (
    <div
      className={`app-wrapper profile-app-wrapper ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}
      style={getThemeStyles(isDarkTheme)}
    >
      <Header isDarkTheme={isDarkTheme} onToggleTheme={handleToggleTheme} activeNav="Profile" />

      <main className="profile-main-container">
        {toastMessage && (
          <div className={`profile-toast-message ${toastMessage.type === 'success' ? 'profile-toast-success' : 'profile-toast-error'}`}>
            {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{toastMessage.text}</span>
          </div>
        )}

        {/* Hero Card */}
        <div className="profile-hero-card">
          <div className="profile-cover-wrap">
            <img
              src={
                user?.wallpaperUrl ||
                "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&h=500"
              }
              alt="Cover Wallpaper"
              className="profile-cover-img"
            />
            <label className="profile-cover-upload-btn">
              <Camera size={16} />
              <span>{uploadingMedia === 'wallpaper' ? t('profile.uploading') : t('profile.changeCover')}</span>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingMedia !== null}
                onChange={(e) => handleFileUpload(e, 'wallpaper')}
              />
            </label>
          </div>

          <div className="profile-overlay-body">
            <div className="profile-avatar-row">
              <div className="profile-avatar-wrapper">
                <img
                  src={
                    user?.avatarUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256"
                  }
                  alt="Avatar"
                  className="profile-avatar-img"
                />
                <label className="profile-avatar-upload-badge" title={t('profile.changeAvatar')}>
                  <Camera size={15} />
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingMedia !== null}
                    onChange={(e) => handleFileUpload(e, 'avatar')}
                  />
                </label>
              </div>

              <div className="profile-user-info">
                <div className="profile-name-row">
                  <div>
                    <h1 className="profile-display-name">
                      {user?.name || 'Athlete Name'}
                      <span className="profile-role-tag">{user?.role || 'Athlete'}</span>
                    </h1>
                    <div className="profile-user-handle">
                      {user?.email} · {t('profile.joined')}: {formattedJoinedDate}
                    </div>
                  </div>

                  <button className="profile-edit-btn" onClick={() => setEditModalOpen(true)}>
                    <Edit2 size={16} />
                    <span>{t('profile.editProfile')}</span>
                  </button>
                </div>

                <p className="profile-bio-description">
                  {user?.bio || t('profile.bioPlaceholder')}
                </p>
              </div>
            </div>

            <div className="profile-hero-stats-row">
              <div className="profile-hero-stat-item">
                <div className="profile-hero-stat-num" style={{ color: 'var(--primary)' }}>147</div>
                <div className="profile-hero-stat-label">Workouts</div>
              </div>
              <div className="profile-hero-stat-item">
                <div className="profile-hero-stat-num" style={{ color: '#f59e0b' }}>31</div>
                <div className="profile-hero-stat-label">Day Streak</div>
              </div>
              <div className="profile-hero-stat-item">
                <div className="profile-hero-stat-num" style={{ color: '#10b981' }}>12</div>
                <div className="profile-hero-stat-label">Personal Bests</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="profile-tabs-bar">
          <button
            className={`profile-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <UserIcon size={16} /> {t('profile.overviewTab')}
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'workouts' ? 'active' : ''}`}
            onClick={() => setActiveTab('workouts')}
          >
            <Dumbbell size={16} /> Workouts
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            <Target size={16} /> {t('profile.metricsTab')}
          </button>
          <button
            className={`profile-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Shield size={16} /> {t('profile.settingsTab')}
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="profile-grid-layout">
            <div className="profile-left-col">
              {/* Body Metrics 4-Grid */}
              <div className="profile-card-panel">
                <div className="profile-card-header">
                  <h2 className="profile-panel-title">
                    Body <span className="profile-title-highlight">Metrics</span>
                  </h2>
                </div>
                <div className="profile-metrics-4grid">
                  <div className="profile-metric-box">
                    <div className="profile-metric-icon-wrap" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899' }}>
                      <Scale size={18} />
                    </div>
                    <span className="profile-metric-label">{t('profile.currentWeight')}</span>
                    <span className="profile-metric-value">
                      {formData.currentWeight}<span className="profile-metric-unit">kg</span>
                    </span>
                  </div>

                  <div className="profile-metric-box">
                    <div className="profile-metric-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)' }}>
                      <Ruler size={18} />
                    </div>
                    <span className="profile-metric-label">{t('profile.height')}</span>
                    <span className="profile-metric-value">
                      {formData.height}<span className="profile-metric-unit">cm</span>
                    </span>
                  </div>

                  <div className="profile-metric-box">
                    <div className="profile-metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                      <Activity size={18} />
                    </div>
                    <span className="profile-metric-label">{t('profile.bmi')}</span>
                    <span className="profile-metric-value">
                      {bmiVal}<span className="profile-metric-unit">({bmiCategory})</span>
                    </span>
                  </div>

                  <div className="profile-metric-box">
                    <div className="profile-metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                      <Target size={18} />
                    </div>
                    <span className="profile-metric-label">{t('profile.targetWeight')}</span>
                    <span className="profile-metric-value">
                      {formData.targetWeight}<span className="profile-metric-unit">kg</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Active Goals */}
              <div className="profile-card-panel">
                <div className="profile-card-header">
                  <h2 className="profile-panel-title">
                    Active <span className="profile-title-highlight">Goals</span>
                  </h2>
                </div>
                {activeGoals.map((g, i) => {
                  const pct = Math.round((g.current / g.target) * 100);
                  const cappedPct = Math.min(100, Math.max(0, pct));
                  return (
                    <div key={i} className="profile-goal-item">
                      <div className="profile-goal-header">
                        <span className="profile-goal-title">{g.label}</span>
                        <span className="profile-goal-subtext">{g.current} / {g.target} {g.unit} ({cappedPct}%)</span>
                      </div>
                      <div className="profile-progress-track">
                        <div
                          className="profile-progress-fill"
                          style={{ width: `${cappedPct}%`, backgroundColor: g.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Personal Bests */}
              <div className="profile-card-panel">
                <div className="profile-card-header">
                  <h2 className="profile-panel-title">
                    Personal <span className="profile-title-highlight">Records</span>
                  </h2>
                </div>
                <div className="profile-pb-grid">
                  {personalBests.map((pb, i) => (
                    <div key={i} className="profile-pb-card">
                      <div className="profile-pb-left">
                        <div className="profile-pb-icon">
                          <Trophy size={18} />
                        </div>
                        <div>
                          <p className="profile-pb-name">{pb.lift}</p>
                          <p className="profile-pb-date">{pb.date}</p>
                        </div>
                      </div>
                      <span className="profile-pb-val">{pb.weight}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column Enriched Athlete Specs */}
            <div className="profile-right-col">
              <div className="profile-card-panel">
                <div className="profile-card-header">
                  <h2 className="profile-panel-title">
                    Athlete <span className="profile-title-highlight">Specs</span>
                  </h2>
                  <button
                    className="profile-edit-btn"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </div>

                <div className="profile-detail-row">
                  <span className="profile-detail-label">Full Name</span>
                  <span className="profile-detail-val">{user?.name || 'N/A'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Email</span>
                  <span className="profile-detail-val">{user?.email}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Phone</span>
                  <span className="profile-detail-val">{formData.phone || 'Not provided'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Age</span>
                  <span className="profile-detail-val">{formData.age} years old</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Gender</span>
                  <span className="profile-detail-val">{formData.gender}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Experience Level</span>
                  <span className="profile-detail-val">{formData.experienceLevel}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Workout Split</span>
                  <span className="profile-detail-val">{formData.workoutSplit}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Body Fat %</span>
                  <span className="profile-detail-val" style={{ color: '#ec4899' }}>{formData.bodyFat}%</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Resting Heart Rate</span>
                  <span className="profile-detail-val" style={{ color: '#ef4444' }}>{formData.rhr} BPM</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Estimated BMR</span>
                  <span className="profile-detail-val">{bmrEst} kcal / day</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Daily Water Goal</span>
                  <span className="profile-detail-val" style={{ color: '#3b82f6' }}>3.5 Liters</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Fitness Program</span>
                  <span className="profile-detail-val">{formData.fitnessGoal}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-detail-label">Storage Backend</span>
                  <span className="profile-detail-val" style={{ color: '#10b981' }}>Cloudinary Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workouts Tab */}
        {activeTab === 'workouts' && (
          <div className="profile-card-panel">
            <div className="profile-card-header">
              <h2 className="profile-panel-title">
                Recent <span className="profile-title-highlight">Sessions</span>
              </h2>
            </div>
            {recentWorkouts.map((w) => (
              <div key={w.id} className="profile-workout-item">
                <div className="profile-workout-icon">
                  <Dumbbell size={20} />
                </div>
                <div className="profile-workout-info">
                  <p className="profile-workout-name">{w.name}</p>
                  <p className="profile-workout-date">{w.date}</p>
                </div>
                <div className="profile-workout-stats">
                  <div className="profile-workout-stat-group">
                    <span className="profile-workout-stat-label">Duration</span>
                    <p className="profile-workout-stat-val">{w.duration}</p>
                  </div>
                  <div className="profile-workout-stat-group">
                    <span className="profile-workout-stat-label">Calories</span>
                    <p className="profile-workout-stat-val" style={{ color: '#f59e0b' }}>{w.calories}</p>
                  </div>
                  <ChevronRight size={18} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metrics & Goals Tab */}
        {activeTab === 'metrics' && (
          <div className="profile-card-panel">
            <div className="profile-card-header">
              <h2 className="profile-panel-title">
                Body Metrics & <span className="profile-title-highlight">Goals</span>
              </h2>
            </div>
            <div className="profile-metrics-4grid">
              <div className="profile-metric-box">
                <span className="profile-metric-label">Height</span>
                <span className="profile-metric-value">{formData.height} cm</span>
              </div>
              <div className="profile-metric-box">
                <span className="profile-metric-label">Current Weight</span>
                <span className="profile-metric-value">{formData.currentWeight} kg</span>
              </div>
              <div className="profile-metric-box">
                <span className="profile-metric-label">Target Weight</span>
                <span className="profile-metric-value">{formData.targetWeight} kg</span>
              </div>
              <div className="profile-metric-box">
                <span className="profile-metric-label">Fitness Program</span>
                <span className="profile-metric-value" style={{ fontSize: '1rem' }}>{formData.fitnessGoal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="profile-card-panel">
            <div className="profile-card-header">
              <h2 className="profile-panel-title">
                Account & <span className="profile-title-highlight">Security</span>
              </h2>
            </div>
            <div className="profile-settings-form">
              <div className="profile-form-group">
                <label className="profile-input-label">Account Email</label>
                <input type="text" className="profile-text-input" value={user?.email || ''} readOnly />
              </div>
              <div className="profile-form-group">
                <label className="profile-input-label">Account Verification</label>
                <input
                  type="text"
                  className="profile-text-input"
                  value={user?.isVerified ? 'Verified' : 'Unverified'}
                  readOnly
                  style={{ color: '#10b981' }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <div className="profile-modal-backdrop">
          <div className="profile-modal-content">
            <button className="profile-modal-close-btn" onClick={() => setEditModalOpen(false)}>
              <X size={20} />
            </button>
            <h3 className="profile-modal-title">{t('profile.editModalTitle')}</h3>

            <form onSubmit={handleSaveProfile} className="profile-modal-grid">
              <div className="profile-grid-full">
                <label className="profile-input-label">{t('profile.fullName')}</label>
                <input
                  type="text"
                  className="profile-text-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="profile-grid-full">
                <label className="profile-input-label">{t('profile.status')}</label>
                <textarea
                  className="profile-text-input"
                  style={{ minHeight: '70px' }}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={t('profile.bioPlaceholder')}
                />
              </div>

              <div>
                <label className="profile-input-label">Age (years)</label>
                <input
                  type="number"
                  className="profile-text-input"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="profile-input-label">Gender</label>
                <select
                  className="profile-text-input"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">{t('profile.genderMale')}</option>
                  <option value="Female">{t('profile.genderFemale')}</option>
                  <option value="Other">{t('profile.genderOther')}</option>
                </select>
              </div>

              <div>
                <label className="profile-input-label">{t('profile.height')} (cm)</label>
                <input
                  type="number"
                  className="profile-text-input"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="profile-input-label">{t('profile.currentWeight')} (kg)</label>
                <input
                  type="number"
                  className="profile-text-input"
                  value={formData.currentWeight}
                  onChange={(e) => setFormData({ ...formData, currentWeight: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="profile-input-label">{t('profile.targetWeight')} (kg)</label>
                <input
                  type="number"
                  className="profile-text-input"
                  value={formData.targetWeight}
                  onChange={(e) => setFormData({ ...formData, targetWeight: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="profile-input-label">Body Fat (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="profile-text-input"
                  value={formData.bodyFat}
                  onChange={(e) => setFormData({ ...formData, bodyFat: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="profile-input-label">Experience Level</label>
                <select
                  className="profile-text-input"
                  value={formData.experienceLevel}
                  onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                >
                  <option value="Beginner (<1 yr)">Beginner (&lt;1 yr)</option>
                  <option value="Intermediate (2-3 yrs)">Intermediate (2-3 yrs)</option>
                  <option value="Advanced (4+ yrs)">Advanced (4+ yrs)</option>
                  <option value="Elite Athlete">Elite Athlete</option>
                </select>
              </div>

              <div>
                <label className="profile-input-label">Workout Split</label>
                <select
                  className="profile-text-input"
                  value={formData.workoutSplit}
                  onChange={(e) => setFormData({ ...formData, workoutSplit: e.target.value })}
                >
                  <option value="Push / Pull / Legs (PPL)">Push / Pull / Legs (PPL)</option>
                  <option value="Upper / Lower Split">Upper / Lower Split</option>
                  <option value="Full Body 3x/week">Full Body 3x/week</option>
                  <option value="Arnold Split">Arnold Split</option>
                </select>
              </div>

              <div>
                <label className="profile-input-label">Resting HR (BPM)</label>
                <input
                  type="number"
                  className="profile-text-input"
                  value={formData.rhr}
                  onChange={(e) => setFormData({ ...formData, rhr: Number(e.target.value) })}
                />
              </div>

              <div>
                <label className="profile-input-label">{t('profile.fitnessGoal')}</label>
                <select
                  className="profile-text-input"
                  value={formData.fitnessGoal}
                  onChange={(e) => setFormData({ ...formData, fitnessGoal: e.target.value })}
                >
                  <option value="Lose Weight">{t('profile.goalLoseWeight')}</option>
                  <option value="Build Muscle">{t('profile.goalGainMuscle')}</option>
                  <option value="Maintain Fitness">{t('profile.goalMaintain')}</option>
                </select>
              </div>

              <div className="profile-grid-full">
                <label className="profile-input-label">{t('profile.phone')}</label>
                <input
                  type="text"
                  className="profile-text-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="profile-grid-full profile-modal-actions">
                <button
                  type="button"
                  className="profile-btn-cancel"
                  onClick={() => setEditModalOpen(false)}
                >
                  {t('profile.cancel')}
                </button>
                <button type="submit" className="profile-btn-save">
                  {t('profile.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Mobile Bottom Navigation */}
      <MobileNav activeNav="profile" />
    </div>
  );
}
