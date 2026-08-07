import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './PasswordInputGroup.css';
import theme from '../../../config/theme';
import { Link } from 'react-router-dom';
import { PATHS } from '../../../routes/paths';
import { useLanguage } from '../../../context/LanguageContext';

interface PasswordInputGroupProps {
  showForgotPassword?: boolean;
  password: string;
  setPassword: (value: string) => void;
  label?: string;
}

const PasswordInputGroup: React.FC<PasswordInputGroupProps> = ({
  showForgotPassword = true,
  password,
  setPassword,
  label,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="input-group">
      <div className="password-header">
        <label htmlFor="password" className="input-label" style={{ color: theme.colors.text2 }}>
          {label || t('login.passwordLabel')}
        </label>
        {showForgotPassword && (
          <Link
            to={PATHS.FORGOTPASSWORD}
            className="forgot-password"
            style={{ color: theme.colors.primary }}
          >
            {t('login.forgotPassword')}
          </Link>
        )}
      </div>
      <div className="password-input-wrap">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="text-input password-input"
          style={{ backgroundColor: theme.colors.inputbg, color: theme.colors.title }}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="password-toggle"
          style={{ color: theme.colors.text2 }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export default PasswordInputGroup;
