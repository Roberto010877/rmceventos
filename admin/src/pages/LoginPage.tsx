import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertCircle, ExternalLink, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { user, userData, loading: authLoading, error: authError, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Error signing in:', err);
      setError('Error al iniciar sesión con Google. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-negro p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-800 bg-gris-oscuro p-8 shadow-2xl">
        <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-dorado/20 via-dorado to-dorado/20"></div>

        <div className="mb-8 text-center">
          <h1 className="mb-2 font-poppins text-3xl font-bold tracking-wider text-dorado">
            RMC EVENTOS
          </h1>
          <p className="font-work text-sm text-gris-claro">
            Panel de Administración
          </p>
        </div>

        {(error || authError) && (
          <div className="mb-6 flex gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-100">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">No se pudo completar el acceso</p>
              <p className="mt-1">{error || authError}</p>
              <p className="mt-2 text-red-100/80">
                Verifica que estés usando exactamente el correo que fue pre-registrado por el superadministrador.
              </p>
            </div>
          </div>
        )}

        <div className="mb-6 rounded-xl border border-dorado/25 bg-dorado/10 p-4 text-sm text-gris-claro">
          <div className="flex gap-2">
            <Info size={18} className="mt-0.5 shrink-0 text-dorado" />
            <div>
              <p className="font-semibold text-dorado">Acceso sólo para equipo autorizado</p>
              <p className="mt-1 text-xs leading-relaxed">
                Si tu usuario aparece como pendiente, inicia sesión una vez con el mismo Gmail registrado en Usuarios para activar tu acceso.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-blanco px-4 py-3 font-medium text-negro shadow-sm transition-colors hover:bg-gray-100 disabled:opacity-70"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-negro border-t-transparent"></div>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Continuar con Google</span>
            </>
          )}
        </button>

        <a
          href="https://rmc-eventos-bo.web.app"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-dorado hover:underline"
        >
          Volver al sitio web
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};

export default LoginPage;
