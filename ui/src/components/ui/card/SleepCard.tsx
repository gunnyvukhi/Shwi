import './SleepCard.css';
import { Moon, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import { formatMinutesToHhMm } from '../../../utils/timeUtils';

export interface SleepCardProps {
    sleep?: {
        id?: number | null;
        durationDisplay?: string | null;
        durationMinutes?: number;
        sleepEfficiency?: number | null;
        sleepLatencyMinutes?: number | null;
        wasoMinutes?: number | null;
        deepSleepMinutes?: number | null;
        remSleepMinutes?: number | null;
        lightSleepMinutes?: number | null;
        timeLabel?: string | null;
        logCount?: number;
    } | null;
    className?: string;
}

export default function SleepCard({
    sleep,
    className = ''
}: SleepCardProps) {
    const { t } = useLanguage();

    // Duration display
    const durationDisplay = sleep?.durationDisplay || '--h --m';

    // Sleep Efficiency Score
    const efficiency = sleep?.sleepEfficiency && sleep.sleepEfficiency > 0
        ? Math.min(100, Math.round(sleep.sleepEfficiency))
        : 0;

    // Quality Rating Category
    let quality = {
        label: t('dashboard.sleepOptimal'),
        colorClass: 'sleep-quality-optimal'
    };

    if (efficiency >= 90) {
        quality = {
            label: t('dashboard.sleepOptimal'),
            colorClass: 'sleep-quality-optimal'
        };
    } else if (efficiency >= 80) {
        quality = {
            label: t('dashboard.sleepGood'),
            colorClass: 'sleep-quality-good'
        };
    } else if (efficiency >= 70) {
        quality = {
            label: t('dashboard.sleepFair'),
            colorClass: 'sleep-quality-fair'
        };
    } else {
        quality = {
            label: t('dashboard.sleepPoor'),
            colorClass: 'sleep-quality-poor'
        };
    }

    // Sleep Stages (Fallback to realistic distribution if missing)
    const deepMins = sleep?.deepSleepMinutes ?? 0;
    const remMins = sleep?.remSleepMinutes ?? 0;
    const lightMins = sleep?.lightSleepMinutes ?? 0;
    const awakeMins = sleep?.wasoMinutes ?? 0;

    const totalStageMins = Math.max(1, deepMins + remMins + lightMins + awakeMins);
    const deepPct = Math.max(8, Math.round((deepMins / totalStageMins) * 100));
    const remPct = Math.max(8, Math.round((remMins / totalStageMins) * 100));
    const awakePct = Math.max(4, Math.round((awakeMins / totalStageMins) * 100));
    const lightPct = Math.max(15, 100 - deepPct - remPct - awakePct);

    return (
        <div className={`sleep-card ${className}`}>
            {/* Header */}
            <div className="sleep-header">
                <div className="sleep-header-main">
                    <div className="sleep-icon-badge">
                        <Moon size={20} className="sleep-icon-moon" />
                    </div>
                    <div className="sleep-title-wrap">
                        <span className="sleep-title">{t('dashboard.sleep')}</span>
                    </div>
                </div>

                <span className={`sleep-quality-tag ${quality.colorClass}`}>
                    {quality.label}
                </span>
            </div>

            {/* Main Value Row */}
            <div className="sleep-metric-row">
                <div className="sleep-value-group">
                    <span className="sleep-duration-number">
                        {durationDisplay}
                    </span>
                </div>

                <div className="sleep-efficiency-pill">
                    <Sparkles size={13} style={{ color: '#818cf8' }} />
                    <span>
                        {t('dashboard.sleepEfficiencyLabel', { val: `${efficiency}` })}
                    </span>
                </div>
            </div>

            {/* Sleep Stages Spectrum Bar */}
            <div className="sleep-spectrum-wrap">
                <div className="sleep-spectrum-bar">
                    <div
                        className="sleep-segment sleep-seg-deep"
                        style={{ width: `${deepPct}%` }}
                        title={`${t('dashboard.deepSleep') || 'Deep'}: ${formatMinutesToHhMm(deepMins)} (${deepPct}%)`}
                    />
                    <div
                        className="sleep-segment sleep-seg-rem"
                        style={{ width: `${remPct}%` }}
                        title={`${t('dashboard.remSleep') || 'REM'}: ${formatMinutesToHhMm(remMins)} (${remPct}%)`}
                    />
                    <div
                        className="sleep-segment sleep-seg-light"
                        style={{ width: `${lightPct}%` }}
                        title={`${t('dashboard.lightSleep') || 'Light'}: ${formatMinutesToHhMm(lightMins)} (${lightPct}%)`}
                    />
                    <div
                        className="sleep-segment sleep-seg-awake"
                        style={{ width: `${awakePct}%` }}
                        title={`${t('dashboard.awake') || 'Awake'}: ${formatMinutesToHhMm(awakeMins)} (${awakePct}%)`}
                    />
                </div>
            </div>

            {/* Footer: Sleep Stage Breakdown & Notes */}
            <div className="sleep-footer">
                <div className="sleep-stage-pill">
                    <span className="sleep-stage-dot dot-deep" />
                    <span>{t('dashboard.deepSleep') || 'Deep'}</span>
                    <span className="sleep-stage-val">{formatMinutesToHhMm(deepMins)}</span>
                </div>
                <div className="sleep-stage-pill">
                    <span className="sleep-stage-dot dot-rem" />
                    <span>{t('dashboard.remSleep') || 'REM'}</span>
                    <span className="sleep-stage-val">{formatMinutesToHhMm(remMins)}</span>
                </div>
                <div className="sleep-stage-pill">
                    <span className="sleep-stage-dot dot-light" />
                    <span>{t('dashboard.lightSleep') || 'Light'}</span>
                    <span className="sleep-stage-val">{formatMinutesToHhMm(lightMins)}</span>
                </div>
                <div className="sleep-stage-pill">
                    <span className="sleep-stage-dot dot-awake" />
                    <span>{t('dashboard.awake') || 'Awake'}</span>
                    <span className="sleep-stage-val">{formatMinutesToHhMm(awakeMins)}</span>
                </div>
            </div>
        </div>
    );
}
