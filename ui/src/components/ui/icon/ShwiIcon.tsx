import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDumbbell } from 'react-icons/fa';
import { PATHS } from '../../../routes/paths';
import './ShwiIcon.css';

type ShwiIconProps = React.PropsWithChildren<{
  size?: number;
  mobile?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
  clickable?: boolean;
}>;

export default function ShwiIcon({ size = 22, mobile = false, style, onClick, clickable = true }: ShwiIconProps) {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (clickable) {
      navigate(PATHS.HOME);
    }
  };

  return (
    <div
      className={mobile ? "mobile-logo-container" : "logo-container"}
      style={{ cursor: clickable ? 'pointer' : 'default', ...style }}
      onClick={handleClick}
      title="Go to Home"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick(e as any);
        }
      }}
    >
      <div className={mobile ? "mobile-logo-icon" : "logo-icon"} style={{ backgroundColor: 'var(--primary, #38bdf8)' }}>
        <FaDumbbell size={size} color="#fff" strokeWidth={2.5} />
      </div>
      <span className={mobile ? "mobile-logo-text" : "logo-text"}>Shwi</span>
    </div>
  );
}