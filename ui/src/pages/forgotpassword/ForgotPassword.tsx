import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { PATHS } from '../../routes/paths';
import { authService } from '../../services/authService';

import "./ForgotPassword.css";
import theme from "../../config/theme";
import LeftLoginBox from "../../components/ui/box/LeftLoginBox";
import Title from "../../components/ui/Text/Title";
import Description from "../../components/ui/Text/Description";
import InputGroup from "../../components/ui/input/InputGroup";
import SubmitButton from "../../components/ui/button/SubmitButton";
import SocialButton from "../../components/ui/button/SocialButton";
import OtpVerificationModal from "../../components/ui/modal/OtpVerificationModal";

import { useAuthStore } from '../../store/useAuthStore';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const res = await authService.forgotPassword(email);
      if (res.requireOtp) {
        setShowOtpModal(true);
      } else {
        navigate(`${PATHS.RESET_PASSWORD}?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process forgot password request.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (data: any) => {
    setShowOtpModal(false);
    if (data.user && data.token) {
      setAuth(data.user, data.token);
      navigate(PATHS.DASHBOARD);
    } else {
      navigate(PATHS.LOGIN);
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
            <Title mb={"0"} fontSize={"2.4rem"} lineHeight={1.1} multiLine={[{ text: "Forgot your", color: theme.colors.title }, { text: " Password?", color: theme.colors.primary }]} />
            <Description mt={"0.5rem"} mb={"0"} fontSize={"0.9rem"} content={"Enter your email address and we'll send a 6-digit OTP code to reset your password so you can get back to training."} />
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
              }}>
                {error}
              </div>
            )}

            {/* Email */}
            <InputGroup id={"email"} label={"Email address"} type={"email"} placeholder={"You@gmail.com"} value={email} onChange={(e) => setEmail(e)} />

            {/* Submit */}
            <SubmitButton label={loading ? "Sending OTP..." : "Send Reset Code"} disabled={loading} />

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
            Remember your password?{" "}
            <Link to={PATHS.LOGIN} className="footer-link">
              Login
            </Link>
          </p>
        </div>
      </div>

      {showOtpModal && (
        <OtpVerificationModal
          email={email}
          purpose="password_reset"
          onSuccess={handleOtpSuccess}
          onClose={() => setShowOtpModal(false)}
        />
      )}
    </div>
  );
}
