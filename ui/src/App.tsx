import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { router } from './routes';
import { useAuthStore } from './store/useAuthStore';
import { LanguageProvider } from './context/LanguageContext';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id';

function App() {
  const checkAuth = useAuthStore((state: any) => state.checkAuth);

  useEffect(() => {
    console.log('app render');
    checkAuth();
  }, [checkAuth]);

  return (
    <LanguageProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <RouterProvider router={router} />
      </GoogleOAuthProvider>
    </LanguageProvider>
  );
}

export default App;