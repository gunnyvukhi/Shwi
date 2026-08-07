import React from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { Globe } from 'lucide-react';
import './LanguageToggle.css';

interface LanguageToggleProps {
  variant?: 'pill' | 'icon' | 'dropdown';
  className?: string;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'pill',
  className = '',
}) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      className={`lang-toggle-btn ${variant} ${className}`}
      onClick={toggleLanguage}
      title={language === 'en' ? 'Switch to Vietnamese' : 'Chuyển sang Tiếng Anh'}
      aria-label="Toggle language"
    >
      <Globe size={16} className="lang-globe-icon" />
      <span className="lang-text-active">
        {language === 'en' ? 'EN' : 'VI'}
      </span>
      <span className="lang-divider">|</span>
      <span className="lang-text-inactive">
        {language === 'en' ? 'VI' : 'EN'}
      </span>
    </button>
  );
};

export default LanguageToggle;
