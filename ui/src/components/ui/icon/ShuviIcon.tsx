import React from 'react';
import theme from '../../../config/theme';
import { FaDumbbell } from 'react-icons/fa';
import './ShuviIcon.css'
type ShuviIconProps = React.PropsWithChildren<{
  size?: number;
  mobile?: boolean;
  style?: React.CSSProperties;
}>;

export default function ShuviIcon({ size = 22, mobile = false, style }: ShuviIconProps) {
  return (
    <div className={mobile ? "mobile-logo-container" : "logo-container"} style={style}>
      <div className={mobile ? "mobile-logo-icon" : "logo-icon"} style={{backgroundColor: theme.colors.primary}}>
        <FaDumbbell size={size} color="#fff" strokeWidth={2.5} />
      </div>
      <span className={mobile ? "mobile-logo-text" : "logo-text"} >Shuvi</span>
    </div>
  );
}