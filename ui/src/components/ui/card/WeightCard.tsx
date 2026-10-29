import { useState, useEffect, useRef } from 'react';
import {
    TrendingDown,
    TrendingUp,
    Pencil,
    X,
    ChevronDown,
    Check,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../../../context/LanguageContext';
import { useAuthStore } from '../../../store/useAuthStore';
import theme from '../../../config/theme';
import { userService } from '../../../services/userService';
import DatePicker from '../../../utils/DatePicker';
import { parseKg } from '../../../utils/weightUtils';
import './WeightCard.css';

export default function WeightCard() {
    const { t } = useLanguage();
    const user = useAuthStore((state: any) => state.user);
    const updateUser = useAuthStore((state: any) => state.updateUser);

    const targetWeight = user?.profile?.targetWeight || 0;
    const currentWeight = user?.metrics?.weight || 0;

    const [modalOpen, setModalOpen] = useState(false);

    // Form data states
    const todayStr = new Date().toISOString().split('T')[0];
    const [weightText, setWeightText] = useState<string>('');
    const [weightDate, setWeightDate] = useState<string>(todayStr);
    const [targetText, setTargetText] = useState<string>('');
    const [fitnessGoal, setFitnessGoal] = useState<number>(() => {
        if (user?.profile?.fitnessGoal !== undefined && user?.profile?.fitnessGoal !== null) {
            return Number(user.profile.fitnessGoal);
        }
        return currentWeight > 0 && targetWeight > currentWeight ? 1 : 0;
    });

    // Form states
    const [weightError, setWeightError] = useState<string>('');
    const [targetError, setTargetError] = useState<string>('');

    // Refs & Custom Dropdown State
    const goalDropdownRef = useRef<HTMLDivElement>(null);
    const [goalDropdownOpen, setGoalDropdownOpen] = useState(false);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (goalDropdownRef.current && !goalDropdownRef.current.contains(e.target as Node)) {
                setGoalDropdownOpen(false);
            }
        }
        if (goalDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [goalDropdownOpen]);

    const closeModal = () => {
        setModalOpen(false);
        setGoalDropdownOpen(false);
    };

    useEffect(() => {
        if (user?.profile?.targetWeight) {
            setTargetText(String(user.profile.targetWeight));
        }
        if (user?.profile?.fitnessGoal !== undefined && user?.profile?.fitnessGoal !== null) {
            setFitnessGoal(Number(user.profile.fitnessGoal));
        }
    }, [user?.profile?.targetWeight, user?.profile?.fitnessGoal]);

    // Circle progress
    const radius = 45;
    const circumference = 2 * Math.PI * radius;

    const loseWeight = (user?.profile?.fitnessGoal !== undefined && user?.profile?.fitnessGoal !== null) && Number(user.profile.fitnessGoal) === 0;

    const progress = loseWeight
        ? (currentWeight > 0 ? Math.min(1, targetWeight / currentWeight) : 0)
        : (targetWeight > 0 ? Math.min(1, currentWeight / targetWeight) : 0);

    const dashOffset = circumference * (1 - progress);

    const handleOpen = () => {
        setWeightText(currentWeight ? String(currentWeight) : '');
        setWeightDate(todayStr);
        setTargetText(targetWeight ? String(targetWeight) : '');
        setFitnessGoal((user?.profile?.fitnessGoal !== undefined && user?.profile?.fitnessGoal !== null)
            ? Number(user.profile.fitnessGoal)
            : (currentWeight > 0 && targetWeight > currentWeight ? 1 : 0));
        setWeightError('');
        setTargetError('');
        setModalOpen(true);
    };

    const handleBlurWeight = () => {
        if (!weightText.trim()) return;
        const n = parseKg(weightText, 20, 300);
        if (!n) setWeightError(t('dashboard.weightRangeError'));
        else { setWeightError(''); setWeightText(String(n)); }
    };

    const handleBlurTarget = () => {
        if (!targetText.trim()) return;
        const n = parseKg(targetText, 20, 300);
        if (!n) setTargetError(t('dashboard.weightRangeError'));
        else { setTargetError(''); setTargetText(String(n)); }
    };

    const handleSave = () => {
        let hasError = false;

        let parsedWeight: number | null = null;
        if (weightText.trim()) {
            parsedWeight = parseKg(weightText, 20, 300);
            if (!parsedWeight) {
                setWeightError(t('dashboard.weightRangeError'));
                hasError = true;
            } else {
                setWeightError('');
            }
        }

        let parsedGoalWeight: number | null = null;
        if (targetText.trim()) {
            parsedGoalWeight = parseKg(targetText, 20, 300);
            if (!parsedGoalWeight) {
                setTargetError(t('dashboard.weightRangeError'));
                hasError = true;
            } else {
                setTargetError('');
            }
        }

        if (hasError) return;

        // Chỉ call API target nếu mục tiêu thực sự có sự thay đổi
        const currentStoredGoal = (user?.profile?.fitnessGoal !== undefined && user?.profile?.fitnessGoal !== null)
            ? Number(user.profile.fitnessGoal)
            : (currentWeight > 0 && targetWeight > currentWeight ? 1 : 0);

        const goalWeightChanged = parsedGoalWeight !== null && parsedGoalWeight !== targetWeight;
        const goalTypeChanged = fitnessGoal !== currentStoredGoal;
        const targetChanged = goalWeightChanged || goalTypeChanged;

        // Chỉ call API body condition nếu cân nặng hoặc ngày ghi nhận thực sự có sự thay đổi so với ban đầu
        const weightValChanged = parsedWeight !== null && parsedWeight !== currentWeight;
        const dateChanged = weightDate !== todayStr;
        const shouldSaveWeight = (weightValChanged || dateChanged) && parsedWeight !== null;

        if (!shouldSaveWeight && !targetChanged) {
            closeModal();
            return;
        }

        // ── 1. Optimistic UI: Cập nhật ngay lập tức dữ liệu trên front-end ──
        if (user) {
            let optimisticUser = { ...user };

            if (targetChanged) {
                const updatedProfile = { ...(optimisticUser.profile || {}) };
                if (goalWeightChanged && parsedGoalWeight !== null) {
                    updatedProfile.targetWeight = parsedGoalWeight;
                }
                if (goalTypeChanged) {
                    updatedProfile.fitnessGoal = fitnessGoal;
                }
                optimisticUser = {
                    ...optimisticUser,
                    profile: updatedProfile,
                };
            }

            if (shouldSaveWeight && parsedWeight !== null) {
                const selectedDate = weightDate || todayStr;
                const isLatestOrToday = !optimisticUser.metrics?.date || selectedDate >= optimisticUser.metrics.date;

                const updatedMetrics = { ...(optimisticUser.metrics || {}) };
                if (isLatestOrToday) {
                    updatedMetrics.weight = parsedWeight;
                    updatedMetrics.date = selectedDate;
                }

                // Cập nhật điểm dữ liệu tháng tương ứng trong weightHistory cho biểu đồ
                const parts = selectedDate.split('-');
                const updatedHistory = Array.isArray(optimisticUser.weightHistory)
                    ? [...optimisticUser.weightHistory]
                    : [];

                if (parts.length >= 2) {
                    const y = parts[0];
                    const m = parts[1];
                    const mPadded = m.padStart(2, '0');
                    const yShort = y.slice(-2);
                    const mKey = `${mPadded}/${yShort}`;
                    const existingIdx = updatedHistory.findIndex((item: any) => item.month === mKey);
                    if (existingIdx >= 0) {
                        updatedHistory[existingIdx] = {
                            ...updatedHistory[existingIdx],
                            weight: parsedWeight,
                        };
                    } else {
                        updatedHistory.push({
                            month: mKey,
                            weight: parsedWeight,
                        });
                    }
                }

                optimisticUser = {
                    ...optimisticUser,
                    metrics: updatedMetrics,
                    weightHistory: updatedHistory,
                };
            }

            // Ghi nhận ngay vào Store & SessionStorage
            updateUser(optimisticUser);
        }

        // Đóng modal lập tức, không để người dùng phải chờ đợi
        closeModal();

        // ── 2. Gửi request ngầm về back-end (Silent Background Request) ──
        const promises: Promise<any>[] = [];
        if (shouldSaveWeight && parsedWeight !== null) {
            promises.push(
                userService.updateBodyCondition({
                    weight: parsedWeight,
                    date: weightDate || todayStr,
                })
            );
        }

        if (targetChanged) {
            const targetPayload: { targetWeight?: number; fitnessGoal?: number } = {};
            if (goalWeightChanged && parsedGoalWeight !== null) {
                targetPayload.targetWeight = parsedGoalWeight;
            }
            if (goalTypeChanged) {
                targetPayload.fitnessGoal = fitnessGoal;
            }

            if (Object.keys(targetPayload).length > 0) {
                promises.push(
                    userService.updateTarget(targetPayload)
                );
            }
        }

        if (promises.length > 0) {
            Promise.all(promises)
                .then(async () => {
                    try {
                        const freshUser = await userService.getMe();
                        updateUser(freshUser);
                    } catch {
                        // Giữ nguyên dữ liệu front-end nếu fetch lại ngầm gặp sự cố mạng
                    }
                })
                .catch((err) => {
                    console.error('Failed to sync weight/target in background:', err);
                });
        }
    };

    // Y-Axis domain encompassing both weight history and target weight with padding
    const yDomain = (() => {
        const weights: number[] = (user?.weightHistory || [])
            .map((item: any) => Number(item?.weight))
            .filter((w: number) => !isNaN(w) && w > 0);

        if (currentWeight > 0) weights.push(currentWeight);
        if (targetWeight > 0) weights.push(targetWeight);

        if (weights.length === 0) return [40, 100];

        const min = Math.min(...weights);
        const max = Math.max(...weights);
        const padding = Math.max(2, Math.round((max - min) * 0.15) || 2);

        return [Math.max(0, Math.floor(min - padding)), Math.ceil(max + padding)];
    })();

    const renderTargetLabel = (props: any) => {
        const { viewBox } = props;
        if (!viewBox || typeof viewBox.y !== 'number') return null;
        const { x, y, width } = viewBox;
        const labelText = `${t('dashboard.targetWeight')}: ${targetWeight} kg`;
        const posX = x + width - 6;
        const posY = y - 7;

        return (
            <g>
                {/* Background halo to prevent dashed line from cutting through text */}
                <text
                    x={posX}
                    y={posY}
                    fill="var(--bg-card-solid)"
                    stroke="var(--bg-card-solid)"
                    strokeWidth={6}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    textAnchor="end"
                    fontSize={11}
                    fontWeight={700}
                >
                    {labelText}
                </text>
                <text
                    x={posX}
                    y={posY}
                    fill="#10b981"
                    textAnchor="end"
                    fontSize={11}
                    fontWeight={700}
                >
                    {labelText}
                </text>
            </g>
        );
    };

    return (
        <>
            {/* ── Card ── */}
            <div className="card-panel">
                <div className="card-header wc-card-header">
                    <div>
                        <h2 className="card-title">
                            {t('dashboard.weightProgressTitle')}{' '}
                            <span className="text-primary">{t('dashboard.weightProgressHighlight')}</span>
                        </h2>
                        <div
                            className="goal-status"
                            style={{ color: loseWeight ? '#34d399' : '#818cf8' }}
                        >
                            {loseWeight
                                ? <TrendingDown size={15} aria-hidden="true" />
                                : <TrendingUp size={15} aria-hidden="true" />}
                            <span>{t('dashboard.targetWeight')} : {targetWeight} kg</span>
                        </div>
                    </div>

                    <button
                        className="btn-secondary wc-update-trigger-btn"
                        onClick={handleOpen}
                        aria-label={t('dashboard.adjust')}
                    >
                        <Pencil size={13} aria-hidden="true" />
                        {t('dashboard.adjust')}
                    </button>
                </div>

                <div className="weight-layout">
                    {/* Line Chart */}
                    <div className="weight-chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                            <LineChart data={user?.weightHistory} margin={{ top: 18, right: 16, left: -20, bottom: 4 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--grid-line)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--chart-text)" fontSize={11} domain={yDomain} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-card-solid)',
                                        borderColor: 'var(--border-color)',
                                        borderRadius: '10px',
                                        color: 'var(--text-main)',
                                        fontSize: '0.8rem',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    }}
                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                {targetWeight > 0 && (
                                    <ReferenceLine
                                        y={targetWeight}
                                        stroke="#10b981"
                                        strokeDasharray="5 4"
                                        strokeWidth={1.5}
                                        label={renderTargetLabel}
                                    />
                                )}
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke={theme.accents.rose}
                                    strokeWidth={2.5}
                                    dot={{ fill: 'var(--bg-card-solid)', stroke: theme.accents.rose, strokeWidth: 2, r: 3.5 }}
                                    activeDot={{ r: 6, fill: theme.accents.rose, stroke: 'var(--bg-card-solid)', strokeWidth: 2 }}
                                    connectNulls
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Circle Progress Widget */}
                    <div className="circle-widget" aria-label={`${currentWeight} kg current weight`}>
                        <svg viewBox="0 0 100 100" className="circle-svg">
                            <circle cx="50" cy="50" r="45" className="circle-bg" />
                            <circle
                                cx="50" cy="50" r="45"
                                className="circle-progress"
                                strokeDasharray={circumference}
                                strokeDashoffset={dashOffset}
                            />
                        </svg>
                        <div className="circle-content">
                            <span className="circle-val">{currentWeight}</span>
                            <span className="circle-unit">kg</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Weight Management Modal (Single Form) ── */}
            {modalOpen && (
                <div
                    className="wc-modal-backdrop"
                    onClick={closeModal}
                >
                    <div
                        className="wc-modal"
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="weight-modal-title"
                    >
                        {/* ── Header ── */}
                        <div className="wc-modal-header">
                            <div className="wc-modal-header-info">
                                <h3 className="wc-modal-title" id="weight-modal-title">
                                    {t('dashboard.weightManagement')}
                                </h3>
                                <p className="wc-modal-subtitle">
                                    {t('dashboard.weightModalSubtitle', { current: currentWeight, target: targetWeight })}
                                </p>
                            </div>
                            <button
                                className="wc-modal-close"
                                onClick={closeModal}
                                aria-label={t('dashboard.cancel')}
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* ── Body ── */}
                        <div className="wc-modal-body">
                            {/* Table Layout: Col 1 = Weights (Current & Target), Col 2 = Date & Goal */}
                            <div className="wc-table-card">
                                {/* Table Row 1: Cân nặng hiện tại & Ngày ghi nhận */}
                                <div className="wc-table-row">
                                    <div className="wc-field-col">
                                        <label className="wc-field-label" htmlFor="wc-weight-val">
                                            {t('dashboard.currentWeightSection')}
                                        </label>
                                        <div className="wc-input-wrap">
                                            <input
                                                id="wc-weight-val"
                                                type="text"
                                                inputMode="decimal"
                                                className={`wc-input${weightError ? ' wc-input--error' : ''}`}
                                                value={weightText}
                                                placeholder={t('dashboard.weightPlaceholder')}
                                                onChange={e => { setWeightText(e.target.value); setWeightError(''); }}
                                                onBlur={handleBlurWeight}
                                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                                aria-label={t('dashboard.currentWeightSection')}
                                            />
                                            <span className="wc-unit">kg</span>
                                        </div>
                                        {weightError && (
                                            <span className="wc-field-error">{weightError}</span>
                                        )}
                                    </div>

                                    <div className="wc-field-col">
                                        <label className="wc-field-label" htmlFor="wc-weight-date">
                                            {t('dashboard.recordDate')}
                                        </label>
                                        <DatePicker
                                            id="wc-weight-date"
                                            value={weightDate}
                                            max={todayStr}
                                            onChange={setWeightDate}
                                            ariaLabel={t('dashboard.recordDate')}
                                        />
                                    </div>
                                </div>

                                <div className="wc-table-divider" />

                                {/* Table Row 2: Mục tiêu cân nặng & Loại mục tiêu */}
                                <div className="wc-table-row">
                                    <div className="wc-field-col">
                                        <label className="wc-field-label" htmlFor="wc-target-val">
                                            {t('dashboard.targetWeight')}
                                        </label>
                                        <div className="wc-input-wrap">
                                            <input
                                                id="wc-target-val"
                                                type="text"
                                                inputMode="decimal"
                                                className={`wc-input${targetError ? ' wc-input--error' : ''}`}
                                                value={targetText}
                                                placeholder={t('dashboard.targetPlaceholder')}
                                                onChange={e => { setTargetText(e.target.value); setTargetError(''); }}
                                                onBlur={handleBlurTarget}
                                                onKeyDown={e => e.key === 'Enter' && handleSave()}
                                                aria-label={t('dashboard.targetWeight')}
                                            />
                                            <span className="wc-unit">kg</span>
                                        </div>
                                        {targetError && (
                                            <span className="wc-field-error">{targetError}</span>
                                        )}
                                    </div>

                                    <div className="wc-field-col" ref={goalDropdownRef}>
                                        <label className="wc-field-label" id="wc-goal-type-label">
                                            {t('dashboard.goalType')}
                                        </label>
                                        <div className="wc-input-wrap wc-input-wrap--dropdown">
                                            <button
                                                type="button"
                                                id="wc-goal-type-select"
                                                className={`wc-select-trigger ${goalDropdownOpen ? 'wc-select-trigger--open' : ''}`}
                                                onClick={() => setGoalDropdownOpen(prev => !prev)}
                                                aria-haspopup="listbox"
                                                aria-expanded={goalDropdownOpen}
                                                aria-labelledby="wc-goal-type-label"
                                            >
                                                <span className="wc-select-value">
                                                    {fitnessGoal === 1 ? (
                                                        <>
                                                            <TrendingUp size={14} className="wc-goal-icon wc-goal-icon--gain" />
                                                            <span>{t('dashboard.gainWeight')}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrendingDown size={14} className="wc-goal-icon wc-goal-icon--lose" />
                                                            <span>{t('dashboard.loseWeight')}</span>
                                                        </>
                                                    )}
                                                </span>
                                                <span className="wc-unit wc-unit--icon" aria-hidden="true">
                                                    <ChevronDown
                                                        size={14}
                                                        className={`wc-dropdown-chevron ${goalDropdownOpen ? 'wc-dropdown-chevron--open' : ''}`}
                                                    />
                                                </span>
                                            </button>

                                            {goalDropdownOpen && (
                                                <div className="wc-dropdown-menu" role="listbox" aria-labelledby="wc-goal-type-label">
                                                    <button
                                                        type="button"
                                                        className={`wc-dropdown-item ${fitnessGoal === 0 ? 'wc-dropdown-item--active' : ''}`}
                                                        onClick={() => {
                                                            setFitnessGoal(0);
                                                            setGoalDropdownOpen(false);
                                                        }}
                                                        role="option"
                                                        aria-selected={fitnessGoal === 0}
                                                    >
                                                        <div className="wc-dropdown-item-left">
                                                            <div className="wc-goal-badge wc-goal-badge--lose">
                                                                <TrendingDown size={13} />
                                                            </div>
                                                            <span className="wc-dropdown-item-text">{t('dashboard.loseWeight')}</span>
                                                        </div>
                                                        {fitnessGoal === 0 && <Check size={13} className="wc-dropdown-check" />}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className={`wc-dropdown-item ${fitnessGoal === 1 ? 'wc-dropdown-item--active' : ''}`}
                                                        onClick={() => {
                                                            setFitnessGoal(1);
                                                            setGoalDropdownOpen(false);
                                                        }}
                                                        role="option"
                                                        aria-selected={fitnessGoal === 1}
                                                    >
                                                        <div className="wc-dropdown-item-left">
                                                            <div className="wc-goal-badge wc-goal-badge--gain">
                                                                <TrendingUp size={13} />
                                                            </div>
                                                            <span className="wc-dropdown-item-text">{t('dashboard.gainWeight')}</span>
                                                        </div>
                                                        {fitnessGoal === 1 && <Check size={13} className="wc-dropdown-check" />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Single Save Button */}
                            <button
                                className="wc-btn wc-btn--primary"
                                onClick={handleSave}
                                disabled={
                                    !weightText.trim() &&
                                    !targetText.trim() &&
                                    fitnessGoal === ((user?.profile?.fitnessGoal !== undefined && user?.profile?.fitnessGoal !== null) ? Number(user.profile.fitnessGoal) : (currentWeight > 0 && targetWeight > currentWeight ? 1 : 0))
                                }
                            >
                                <span>{t('dashboard.adjust')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
