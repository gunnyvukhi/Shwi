import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { PATHS } from '../../../routes/paths';
import { useAuthStore } from '../../../store/useAuthStore';
import { authService } from '../../../services/authService';
import './SocialButton.css';

declare global {
  interface Window {
    AppleID: any;
  }
}

type Props = {
  name?: "Google" | "Apple";
  onClick?: () => void;
};

interface Provider {
  label: "Google" | "Apple";
  icon: React.ReactNode;
}

const providers: Provider[] = [
  {
    label: "Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853" />
        <path d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    label: "Apple",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
        <path d="M13.17 9.53c-.02-1.98 1.62-2.94 1.69-2.98-0.92-1.35-2.36-1.53-2.87-1.55-1.22-.12-2.38.72-3 .72-.62 0-1.58-.7-2.6-.68-1.33.02-2.57.78-3.25 1.97C1.63 9.18 2.68 13.1 4.2 15.2c.76 1.07 1.65 2.28 2.82 2.24 1.14-.05 1.57-.73 2.94-.73 1.37 0 1.76.73 2.96.7 1.22-.02 1.99-1.09 2.74-2.17.87-1.24 1.22-2.44 1.24-2.5-.03-.01-2.37-.9-2.73-3.21zM11.1 3.57c.62-.75 1.04-1.8.93-2.84-.9.04-1.99.6-2.63 1.35-.58.66-1.09 1.72-.95 2.73.99.08 2.01-.5 2.65-1.24z" />
      </svg>
    ),
  },
];

const loadAppleSdk = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.AppleID) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://appleid.cdn-apple.com/appleauth/static/js/api/v1/appleid.auth.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

const SocialButton: React.FC<Props> = ({ name = "Google", onClick }) => {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state: any) => state.setAuth);
  const navigate = useNavigate();

  const social = providers.find((provider) => provider.label === name);

  const googleLoginHandler = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await userInfoRes.json();

        const res = await authService.googleLogin({
          googleId: googleUser.sub,
          email: googleUser.email,
          name: googleUser.name || 'Google Athlete',
          avatarUrl: googleUser.picture,
        });

        if (res.user && res.token) {
          setAuth(res.user, res.token);
          navigate(PATHS.DASHBOARD);
        }
      } catch (err: any) {
        alert(err.message || 'Google authentication failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google OAuth Popup Error:', errorResponse);
      setLoading(false);
    },
  });

  const handleAppleClick = async () => {
    const appleClientId = import.meta.env.VITE_APPLE_CLIENT_ID;

    if (!appleClientId || appleClientId === 'dummy_client_id') {
      // Fallback for development if VITE_APPLE_CLIENT_ID is not set in .env
      setLoading(true);
      try {
        const res = await authService.appleLogin({
          appleId: `apple_demo_${Date.now()}`,
          email: `apple.user.${Math.floor(Math.random() * 1000)}@privaterelay.appleid.com`,
          name: "Apple Athlete"
        });

        if (res.user && res.token) {
          setAuth(res.user, res.token);
          navigate(PATHS.DASHBOARD);
        }
      } catch (err: any) {
        alert(err.message || "Apple login failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);

    try {
      await loadAppleSdk();
      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: 'name email',
        redirectURI: window.location.origin,
        usePopup: true,
      });

      const response = await window.AppleID.auth.signIn();
      const identityToken = response.authorization?.id_token;
      const userObj = response.user;
      let formattedName = 'Apple Athlete';

      if (userObj?.name) {
        formattedName = `${userObj.name.firstName || ''} ${userObj.name.lastName || ''}`.trim() || formattedName;
      }

      const res = await authService.appleLogin({
        identityToken,
        name: formattedName,
        email: userObj?.email,
      });

      if (res.user && res.token) {
        setAuth(res.user, res.token);
        navigate(PATHS.DASHBOARD);
      }
    } catch (err: any) {
      if (err?.error !== 'popup_closed_by_user') {
        alert(err.message || 'Apple Sign-In failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialClick = async () => {
    if (onClick) {
      onClick();
      return;
    }

    if (name === "Google") {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || clientId === 'dummy_client_id') {
        setLoading(true);
        try {
          const res = await authService.googleLogin({
            googleId: `google_demo_${Date.now()}`,
            email: `google.user.${Math.floor(Math.random() * 1000)}@gmail.com`,
            name: "Google Athlete",
            avatarUrl: "https://lh3.googleusercontent.com/a/default-user"
          });
          if (res.user && res.token) {
            setAuth(res.user, res.token);
            navigate(PATHS.DASHBOARD);
          }
        } catch (err: any) {
          alert(err.message || "Google login failed.");
        } finally {
          setLoading(false);
        }
        return;
      }

      googleLoginHandler();
    } else if (name === "Apple") {
      handleAppleClick();
    }
  };

  return (
    <>
      {social && (
        <button
          type="button"
          className="social-btn"
          onClick={handleSocialClick}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1 }}
        >
          {social.icon}
          {loading ? `Connecting...` : social.label}
        </button>
      )}
    </>
  );
};

export default SocialButton;
