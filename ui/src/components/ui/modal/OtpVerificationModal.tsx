import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, X, CheckCircle2 } from 'lucide-react';
import { authService } from '../../../services/authService';
import { useAuthStore } from '../../../store/useAuthStore';
import './OtpVerificationModal.css';

interface OtpVerificationModalProps {
  email: string;
  purpose?: 'email_verification' | 'password_reset';
  onSuccess: (data: any) => void;
  onClose: () => void;
}

export const OtpVerificationModal: React.FC<OtpVerificationModalProps> = ({
  email,
  purpose = 'email_verification',
  onSuccess,
  onClose,
}) => {
  // Step state: 'otp' for entering code; 'new_password' for setting password after OTP
  const [step, setStep] = useState<'otp' | 'new_password'>('otp');
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [verifiedOtp, setVerifiedOtp] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(60);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasteData)) {
      const pastedDigits = pasteData.split('');
      setDigits(pastedDigits);
      if (inputRefs.current[5]) {
        inputRefs.current[5].focus();
      }
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = digits.join('');
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits of the OTP code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (purpose === 'email_verification') {
        const res = await authService.verifyEmailOtp(email, otpCode);
        if (res.user && res.token) {
          setAuth(res.user, res.token);
        }
        onSuccess(res);
      } else {
        // Password reset: Save verified OTP and transition to password entry
        setVerifiedOtp(otpCode);
        setStep('new_password');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPasswordOtp(email, verifiedOtp, newPassword);
      if (res.user && res.token) {
        setAuth(res.user, res.token);
      }
      onSuccess(res);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError(null);
    setResendMsg(null);

    try {
      await authService.resendOtp(email, purpose);
      setResendMsg('A new 6-digit OTP code has been sent to your email.');
      setResendTimer(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP code.');
    }
  };

  return (
    <div className="otp-overlay">
      <div className="otp-card">
        <button type="button" className="otp-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        <div className="otp-badge">
          {step === 'otp' ? <Mail size={26} /> : <Lock size={26} />}
        </div>

        <h2 className="otp-title">
          {step === 'otp'
            ? purpose === 'email_verification'
              ? 'Verify Your Email'
              : 'Enter Security Code'
            : 'Set New Password'}
        </h2>

        <p className="otp-subtitle">
          {step === 'otp' ? (
            <>
              We sent a 6-digit security code to<br />
              <span className="otp-email-highlight">{email}</span>
            </>
          ) : (
            'Enter your new password below to reset your account and log in immediately.'
          )}
        </p>

        {error && <div className="otp-error-msg">{error}</div>}
        {resendMsg && <div className="otp-success-msg">{resendMsg}</div>}

        {step === 'otp' ? (
          <form onSubmit={handleOtpSubmit}>
            <div className="otp-inputs">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="otp-digit-input"
                />
              ))}
            </div>

            <button
              type="submit"
              className="otp-submit-btn"
              disabled={loading || digits.join('').length !== 6}
            >
              {loading
                ? 'Verifying...'
                : purpose === 'email_verification'
                ? 'Verify & Start Training'
                : 'Continue to Password'}
            </button>

            <div className="otp-resend-row">
              Didn't receive the code?
              {resendTimer > 0 ? (
                <span style={{ color: '#94a3b8', marginLeft: '0.3rem' }}>
                  Resend in {resendTimer}s
                </span>
              ) : (
                <button type="button" className="otp-resend-btn" onClick={handleResend}>
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit}>
            <div className="otp-password-group">
              <div>
                <label className="otp-input-label">New Password</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="otp-password-input"
                  required
                  minLength={6}
                  autoFocus
                />
              </div>

              <div>
                <label className="otp-input-label">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="otp-password-input"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              className="otp-submit-btn"
              disabled={loading || !newPassword || !confirmPassword}
            >
              {loading ? 'Resetting Password...' : 'Reset & Log In Now'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default OtpVerificationModal;
