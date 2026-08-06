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

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

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
      setError("6-digit OTP reset code is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPasswordOtp(email, otp, newPassword);
      setSuccessMsg(res.message || "Password reset successfully!");

      if (res.user && res.token) {
        setAuth(res.user, res.token);
        setTimeout(() => {
          navigate(PATHS.DASHBOARD);
        }, 800);
      } else {
        setTimeout(() => {
          navigate(PATHS.LOGIN);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper" style={{backgroundColor: theme.colors.background}}>
      <LeftLoginBox/>
      <div className="right-panel">
        <ShwiIcon size={22} mobile/>

        <div className="form-wrapper">
          <div className="form-header">
            <Title mb={"0"} fontSize={"2.4rem"} lineHeight={1.1} multiLine={[{text: "Set New", color: theme.colors.title}, {text: " Password", color: theme.colors.primary}]}/>
            <Description mt={"0.5rem"} fontSize={"0.9rem"} content={isPreFilled ? "Enter your new password below to reset your account and log in immediately." : "Enter your 6-digit OTP security code and new password."} />
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
                <InputGroup id={"email"} label={"Email address"} type={"email"} placeholder={"You@gmail.com"} value={email} onChange={(e) => setEmail(e)} />
                <InputGroup id={"otp"} label={"6-digit OTP Code"} type={"text"} placeholder={"Enter 6-digit code"} value={otp} onChange={(e) => setOtp(e)} />
              </>
            )}

            {/* New Password */}
            <PasswordInputGroup password={newPassword} setPassword={(e)=>setNewPassword(e)} showForgotPassword={false}/>

            {/* Confirm Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: theme.colors.text2, marginBottom: '0.4rem' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  backgroundColor: theme.colors.inputbg,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  padding: '0 1rem',
                  color: theme.colors.text,
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                required
              />
            </div>

            {/* Submit */}
            <SubmitButton label={loading ? "Resetting..." : "Reset & Log In Now"} disabled={loading}/>
          </form>

          <p className="footer-text">
            Back to{" "}
            <Link to={PATHS.LOGIN} className="footer-link">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
