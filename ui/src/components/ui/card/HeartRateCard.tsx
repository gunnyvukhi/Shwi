import { useState, useEffect } from 'react';
import { Heart, Activity } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';
import {
    subscribeToHeartRate,
    subscribeToRestingHeartRate,
    type RealtimeHeartRateData
} from '../../../services/firebaseRealtime';
import './HeartRateCard.css';

export interface HeartRateCardProps {
    UserID?: number | string | null;
    className?: string;
}

interface ZoneInfo {
    label: string;
    desc: string;
    colorClass: string;
    activeSegment: number;
}

export default function HeartRateCard({
    UserID,
    className = ''
}: HeartRateCardProps) {
    const { t } = useLanguage();

    // Real-time Heart Rate states directly from Firebase RTDB
    const [realtimeHr, setRealtimeHr] = useState<RealtimeHeartRateData | null>(null);
    const [realtimeRhr, setRealtimeRhr] = useState<RealtimeHeartRateData | null>(null);

    const bpm = realtimeHr?.bpm
    const restingBpm = realtimeRhr?.bpm
    const isLive = Boolean(realtimeHr)

    useEffect(() => {
        const userId = UserID;
        if (!userId) return;

        const unsubscribeHr = subscribeToHeartRate(userId, (data) => {
            if (data && data.bpm) {
                setRealtimeHr(data);
            }
        });

        const unsubscribeRhr = subscribeToRestingHeartRate(userId, (data) => {
            if (data && data.bpm) {
                setRealtimeRhr(data);
            }
        });

        return () => {
            unsubscribeHr();
            unsubscribeRhr();
        };
    }, [UserID]);



    const bpmNum = typeof bpm === 'number' ? bpm : Number(bpm) || 0;
    const restingBpmNum = typeof restingBpm === 'number' ? restingBpm : Number(restingBpm) || 0;

    let zone: ZoneInfo = {
        label: '---',
        desc: t('dashboard.noActiveStream'),
        colorClass: 'zone-none',
        activeSegment: 0,
    };

    if (0 < bpmNum && bpmNum < 60) {
        zone = {
            label: t('dashboard.Resting'),
            desc: t('dashboard.DeepRest'),
            colorClass: 'zone-resting',
            activeSegment: 1,
        };
    }
    else if (bpmNum <= 100) {
        zone = {
            label: t('dashboard.Normal'),
            desc: t('dashboard.OptimalZone'),
            colorClass: 'zone-normal',
            activeSegment: 2,
        };
    }
    else if (bpmNum <= 140) {
        zone = {
            label: t('dashboard.FatBurn'),
            desc: t('dashboard.AerobicBase'),
            colorClass: 'zone-fatburn',
            activeSegment: 3,
        };
    }
    else if (bpmNum <= 170) {
        zone = {
            label: 'Cardio',
            desc: t('dashboard.Cardiovascular'),
            colorClass: 'zone-cardio',
            activeSegment: 4,
        };
    }
    else {
        zone = {
            label: t('dashboard.Peak'),
            desc: t('dashboard.HighIntensity'),
            colorClass: 'zone-peak',
            activeSegment: 5,
        };
    }

    // Dynamic pulse duration matching current BPM
    const pulseDuration = bpmNum >= 40 && bpmNum <= 220
        ? `${(60 / bpmNum).toFixed(2)}s`
        : '1.2s';

    // Dynamic ECG amplitude and speed based on BPM
    // Amplitude: 0.5 (nhịp chậm/nghỉ ngơi) -> 1.0 (nhịp vừa) -> 1.3 (nhịp cao)
    const amplitude = bpmNum > 0
        ? Math.min(1.3, Math.max(0.48, 0.48 + ((bpmNum - 40) / 140) * 0.75))
        : 0.08;

    const pY = (30 - 7 * amplitude).toFixed(1);
    const qY = (30 + 8 * amplitude).toFixed(1);
    const rY = Math.max(2, 30 - 27 * amplitude).toFixed(1);
    const sY = Math.min(58, 30 + 27 * amplitude).toFixed(1);
    const tY = (30 - 10 * amplitude).toFixed(1);

    const ecgPath = `M 0 30 L 35 30 L 45 30 L 50 ${pY} L 56 ${qY} L 62 ${rY} L 69 ${sY} L 74 30 L 85 30 L 95 ${tY} L 105 30 L 150 30 L 185 30 L 195 30 L 200 ${pY} L 206 ${qY} L 212 ${rY} L 219 ${sY} L 224 30 L 235 30 L 245 ${tY} L 255 30 L 300 30`;

    return (
        <div className={`heart-rate-card ${className}`}>
            {/* Header */}
            <div className="heart-rate-header">
                <div className="heart-rate-header-main">
                    <div className="heart-rate-icon-badge">
                        <Heart
                            size={20}
                            className="heart-icon-beating"
                            style={{ animationDuration: pulseDuration }}
                        />
                    </div>
                    <div className="heart-rate-title-wrap">
                        <span className="heart-rate-title">{t('dashboard.heartRate') || 'Heart Rate'}</span>
                        <p className="heart-rate-subtitle">{zone.desc}</p>
                    </div>
                </div>

                {isLive && (
                    <div className="heart-rate-live-badge" title="Firebase RTDB Live Stream">
                        <span className="live-dot-wrap">
                            <span className="live-dot-ping" />
                            <span className="live-dot-core" />
                        </span>
                        <span>LIVE</span>
                    </div>
                )}
            </div>

            {/* Main Value & Zone Row */}
            <div className="heart-rate-metric-row">
                <div className="heart-rate-value-group">
                    <span className="heart-rate-bpm-number">
                        {bpmNum > 0 ? bpmNum : '---'}
                    </span>
                    <span className="heart-rate-bpm-unit">BPM</span>
                </div>

                <span className={`heart-rate-zone-tag ${zone.colorClass}`}>
                    {zone.label}
                </span>
            </div>

            {/* Animated ECG Waveform */}
            <div className="heart-rate-wave-box" aria-hidden="true">
                <svg
                    viewBox="0 0 300 60"
                    preserveAspectRatio="none"
                    className="heart-rate-wave-svg"
                >
                    <defs>
                        <linearGradient id="shwiEcgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                            <stop offset="25%" stopColor="#f43f5e" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#f43f5e" stopOpacity="1" />
                            <stop offset="75%" stopColor="#fb7185" stopOpacity="1" />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.2" />
                        </linearGradient>
                    </defs>
                    <line x1="0" y1="30" x2="300" y2="30" className="ecg-grid-line" />
                    <path
                        d={ecgPath}
                        className="ecg-line-bg"
                    />
                    <path
                        d={ecgPath}
                        pathLength="100"
                        className="ecg-line"
                        stroke="url(#shwiEcgGrad)"
                        style={{ animationDuration: '3s' }}
                    />
                </svg>
            </div>

            {/* Footer: Resting Heart Rate & Zone Spectrum Bar */}
            <div className="heart-rate-footer">
                <div className="heart-rate-resting-box">
                    <Activity size={13} className="text-muted" style={{ opacity: 0.7 }} />
                    <span className="heart-rate-resting-label">
                        {t('dashboard.restingHeader') + ': '}
                    </span>
                    <span className="heart-rate-resting-val">
                        {restingBpmNum > 0 ? `${restingBpmNum} bpm` : '---'}
                    </span>
                </div>

                {/* 5-segment spectrum bar */}
                <div className="heart-rate-spectrum" title={`Zone: ${zone.label}`}>
                    <span className={`spectrum-segment spectrum-seg-1 ${zone.activeSegment === 1 ? 'active' : ''}`} />
                    <span className={`spectrum-segment spectrum-seg-2 ${zone.activeSegment === 2 ? 'active' : ''}`} />
                    <span className={`spectrum-segment spectrum-seg-3 ${zone.activeSegment === 3 ? 'active' : ''}`} />
                    <span className={`spectrum-segment spectrum-seg-4 ${zone.activeSegment === 4 ? 'active' : ''}`} />
                    <span className={`spectrum-segment spectrum-seg-5 ${zone.activeSegment === 5 ? 'active' : ''}`} />
                </div>
            </div>
        </div>
    );
}
