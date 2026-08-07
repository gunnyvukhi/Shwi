import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/useAuthStore';

import theme from "../../config/theme";
import LeftLoginBox from "../../components/ui/box/LeftLoginBox";
import ShwiIcon from "../../components/ui/icon/ShwiIcon";
import Title from "../../components/ui/Text/Title";
import Description from "../../components/ui/Text/Description";
import InputGroup from "../../components/ui/input/InputGroup";
import PasswordInputGroup from "../../components/ui/input/PasswordInputGroup";
import SubmitButton from "../../components/ui/button/SubmitButton";
import LanguageToggle from "../../components/ui/button/LanguageToggle";
import { useLanguage } from "../../context/LanguageContext";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const navigate = useNavigate();
  const { t } = useLanguage();

  const isPreFilled = Boolean(searchParams.get("email") && (searchParams.get("otp") || searchParams.get("token")));

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const otpParam = searchParams.get("otp") || searchParams.get("token");

    if (emailParam) setEmail(emailParam);
    if (otpParam) setOtp(otpParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!otp.trim()) {
      setError(t('resetPassword.otpRequired'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('resetPassword.passwordMinLength'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('resetPassword.passwordsDoNotMatch'));
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPasswordOtp(email, otp, newPassword);
      setSuccessMsg(res.message || t('resetPassword.successMessage'));

      if (res.user && res.token) {
        useAuthStore.getState().setAuth(res.user, res.token);
        setTimeout(() => {
          navigate(PATHS.DASHBOARD);
        }, 800);
      } else {
        setTimeout(() => {
          navigate(PATHS.LOGIN);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || t('resetPassword.passwordsDoNotMatch'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{ backgroundColor: theme.colors.background, position: 'relative' }}>
      {/* Top right language toggle switcher */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 20 }}>
        <LanguageToggle />
      </div>

      <LeftLoginBox />
      <div className="right-panel">
        <ShwiIcon size={22} mobile />

        <div className="form-wrapper">
          <div className="form-header">
            <Title
              mb={"0"}
              fontSize={"2.4rem"}
              lineHeight={1.1}
              multiLine={[
                { text: t('resetPassword.title1'), color: theme.colors.title },
                { text: t('resetPassword.title2'), color: theme.colors.primary }
              ]}
            />
            <Description
              mt={"0.5rem"}
              fontSize={"0.9rem"}
              content={isPreFilled ? t('resetPassword.descriptionPreFilled') : t('resetPassword.descriptionNormal')}
            />
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {successMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid #38bdf8',
                borderRadius: '8px',
                color: '#38bdf8',
                fontSize: '0.85rem',
                marginBottom: '1rem'
              }}>
                {successMsg}
              </div>
            )}

            {/* Email & OTP (Hidden if already pre-filled from modal/URL) */}
            {!isPreFilled && (
              <>
                <InputGroup
                  id={"email"}
                  label={t('login.emailLabel')}
                  type={"email"}
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e)}
                />
                <InputGroup
                  id={"otp"}
                  label={t('resetPassword.otpLabel')}
                  type={"text"}
                  placeholder={t('resetPassword.otpPlaceholder')}
                  value={otp}
                  onChange={(e) => setOtp(e)}
                />
              </>
            )}

            {/* New Password */}
            <PasswordInputGroup
              password={newPassword}
              setPassword={(e) => setNewPassword(e)}
              showForgotPassword={false}
            />

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: theme.colors.text2, marginBottom: '0.4rem' }}>
                {t('resetPassword.confirmPasswordLabel')}
              </label>
              <input
                type="password"
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: theme.colors.inputbg,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '0 1rem',
                  color: theme.colors.title,
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Submit */}
            <SubmitButton
              label={loading ? t('common.resetting') : t('resetPassword.submitBtn')}
              disabled={loading}
            />
          </form>

          <p className="footer-text">
            {t('common.backTo')}{" "}
            <Link to={PATHS.LOGIN} className="footer-link">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
