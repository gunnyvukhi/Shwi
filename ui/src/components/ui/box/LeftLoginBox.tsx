import React from 'react';
import './LeftLoginBox.css';
import theme from '../../../config/theme';
import { Zap } from "lucide-react";
import ShwiIcon from '../icon/ShwiIcon';
import Title from '../Text/Title';
import Description from '../Text/Description';
import StatsBox from './StatsBox';
import { useLanguage } from '../../../context/LanguageContext';

type LeftLoginBoxProps = object;

const LeftLoginBox: React.FC<LeftLoginBoxProps> = () => {
  const { t } = useLanguage();

  return (
    <div className="left-panel">
      <img
        src="https://images.unsplash.com/photo-1590487988256-9ed24133863e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxneW0lMjB3ZWlnaHRsaWZ0aW5nJTIwZGFyayUyMGRyYW1hdGljfGVufDF8fHx8MTc4MTI2ODg5N3ww&ixlib=rb-4.1.0&q=80&w=1080"
        alt="Gym equipment"
        className="left-panel-img"
      />
      {/* Gradient overlay */}
      <div className="left-panel-overlay" />
      {/* Content */}
      <div className="left-panel-content">
        {/* Logo */}
        <ShwiIcon size={22} />

        {/* Quote */}
        <div>
          <div className="quote-container">
            <Zap size={18} style={{ color: theme.colors.primary, fill: theme.colors.primary }} />
            <span className="quote-text" style={{ color: theme.colors.primary }}>{t('leftBox.quoteBadge')}</span>
          </div>
          <Title multiLine={[
            { text: t('leftBox.title1') },
            { text: t('leftBox.title2'), color: "#38bdf8" },
            { text: t('leftBox.title3') }
          ]} />
          <Description mt={'1.25rem'} mw={'38ch'} content={t('leftBox.description')} />
          {/* Stats strip */}
          <StatsBox stats={[
            { value: "2.4M+", label: t('leftBox.activeAthletes') },
            { value: "180+", label: t('leftBox.workoutPrograms') },
            { value: "98%", label: t('leftBox.memberSatisfaction') },
          ]} />
        </div>
      </div>
    </div>
  );
};

export default LeftLoginBox;
