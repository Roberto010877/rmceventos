import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-negro">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-dorado border-t-transparent"></div>
      </div>
    );
  }

  if (user && userData) {
    return <Navigate to="/" replace />;
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      // The AuthContext will handle user creation in Firestore if it doesn't exist
      navigate('/');
    } catch (err: any) {
      console.error("Error signing in:", err);
      setError("Error al iniciar sesión con Google. Por favor, intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-negro p-4">
      <div className="w-full max-w-md bg-gris-oscuro rounded-2xl shadow-2xl p-8 border border-gray-800 relative overflow-hidden">
        {/* Decoración sutil con el color dorado */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-dorado/20 via-dorado to-dorado/20"></div>
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-poppins font-bold text-dorado tracking-wider mb-2">
            RMC EVENTOS
          </h1>
          <p className="text-gris-claro text-sm font-work">
            Panel de Administración
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-blanco text-negro font-medium py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-70"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-negro border-t-transparent"></div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continuar con Google</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
