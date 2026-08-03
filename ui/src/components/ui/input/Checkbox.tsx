import React from 'react';
import './Checkbox.css'
type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  id?: string;
};

const Checkbox: React.FC<Props> = ({ checked, onChange, label = 'Check box', id }) => {
  return (
    <div className="checkbox-group">
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="checkbox-btn"

      >
        {checked && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden>
            <path d="M1 4L4 7L10 1" stroke="#fff" strokeWidth={2} strokeLinecap='round' strokeLinejoin='round'></path>        
        </svg>
        )}
      </button>
      <span className="checkbox-text">{label}</span>
    </div>
  );
};

export default Checkbox;
