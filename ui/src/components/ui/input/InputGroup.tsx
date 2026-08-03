import React from 'react';
import './InputGroup.css';
import theme from '../../../config/theme';

interface InputGroupProps {
  id?: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}

const InputGroup: React.FC<InputGroupProps> = ({
  id = 'email',
  label = 'Email address',
  type = 'email',
  placeholder = 'you@shuvi.app',
  value,
  onChange,
}) => (
  <div className="input-group" >
    <label htmlFor={id} className="input-label" style={{color: theme.colors.text2}}>
      {label}
    </label>
     <div className="input-wrap">
    <input
      id={id}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-input"
      style={{backgroundColor: theme.colors.inputbg, color: theme.colors.title}}
    />
    </div>
  </div>
);

export default InputGroup;
