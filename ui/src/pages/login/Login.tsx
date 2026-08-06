import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/authService';

import "./Login.css";

import theme from "../../config/theme";
import LeftLoginBox from "../../components/ui/box/LeftLoginBox";
import Title from "../../components/ui/Text/Title";
import Description from "../../components/ui/Text/Description";
import InputGroup from "../../components/ui/input/InputGroup";
import PasswordInputGroup from "../../components/ui/input/PasswordInputGroup";
import Checkbox from "../../components/ui/input/Checkbox";
import SubmitButton from "../../components/ui/button/SubmitButton";
import SocialButton from "../../components/ui/button/SocialButton";
import OtpVerificationModal from "../../components/ui/modal/OtpVerificationModal";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await authService.login(email, password);
      if (res.user && res.token) {
        setAuth(res.user, res.token);
        navigate(PATHS.DASHBOARD);
      }
    } catch (err: any) {
      if (err.requireVerification) {
        setShowOtpModal(true);
        setError("Your account is not verified yet. Please enter the OTP security code sent to your email.");
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (data: any) => {
    setShowOtpModal(false);
    if (data.user && data.token) {
      setAuth(data.user, data.token);
      navigate(PATHS.DASHBOARD);
    }
  };

  return (
    <div className="login-wrapper" style={{ backgroundColor: theme.colors.background }}>
      {/* Left panel — gym photo */}
      <LeftLoginBox />
      {/* Right panel — login form */}
      <div className="right-panel">

        <div className="form-wrapper">
          <div className="form-header">
            <Title mb={"0"} fontSize={"2.4rem"} lineHeight={1.1} multiLine={[{ text: "Welcome back,", color: theme.colors.title }, { text: "athlete.", color: theme.colors.primary }]} />
            <Description mt={"0.5rem"} mb={"0"} fontSize={"0.9rem"} content={"Log in to continue your training journey."} />
          </div>

          <form onSubmit={handleLoginSubmit} className="login-form">
            {error && (
              <div style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                color: '#ef4444',
                fontSize: '0.85rem',
              }}>
                {error}
              </div>
            )}

            {/* Email */}
            <InputGroup id={"email"} label={"Email address"} type={"email"} placeholder={"You@gmail.com"} value={email} onChange={(e) => setEmail(e)} />
            {/* Password */}
            <PasswordInputGroup password={password} setPassword={(e) => setPassword(e)} showForgotPassword={true} />
            {/* Remember me */}
            <Checkbox label={"Keep me logged in for 30 days"} checked={rememberMe} onChange={(e) => setRememberMe(e)} />

            {/* Submit */}
            <SubmitButton label={loading ? "Logging in..." : "Start Training"} disabled={loading} />

            {/* Divider */}
            <div className="divider-group">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            {/* Social logins */}
            <div className="social-group">
              <SocialButton name="Google" />
              <SocialButton name="Apple" />
            </div>
          </form>

          <p className="footer-text">
            New to Shuvi?{" "}
            <Link to={PATHS.REGISTER} className="footer-link">
              Create your free account
            </Link>
          </p>
        </div>
      </div>

      {showOtpModal && (
        <OtpVerificationModal
          email={email}
          purpose="email_verification"
          onSuccess={handleOtpSuccess}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
}
