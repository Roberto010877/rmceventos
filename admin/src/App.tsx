import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FotosPage = lazy(() => import('./pages/FotosPage'));
const EventosPage = lazy(() => import('./pages/EventosPage'));
const TestimoniosPage = lazy(() => import('./pages/TestimoniosPage'));
const ContactosPage = lazy(() => import('./pages/ContactosPage'));
const ServiciosPage = lazy(() => import('./pages/ServiciosPage'));
const UsuariosPage = lazy(() => import('./pages/UsuariosPage'));
const AuditoriaPage = lazy(() => import('./pages/AuditoriaPage'));
const ConfiguracionPage = lazy(() => import('./pages/ConfiguracionPage'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={
          <div className="flex h-screen w-screen items-center justify-center bg-[var(--bg-primary)]">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-dorado border-t-transparent"></div>
          </div>
        }>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            
            <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="fotos" element={<FotosPage />} />
              <Route path="eventos" element={<EventosPage />} />
              <Route path="testimonios" element={<TestimoniosPage />} />
              <Route path="contactos" element={<ContactosPage />} />
              <Route path="servicios" element={<ProtectedRoute requiredRole={['admin', 'superadmin']}><ServiciosPage /></ProtectedRoute>} />
              <Route path="usuarios" element={<ProtectedRoute requiredRole={['superadmin']}><UsuariosPage /></ProtectedRoute>} />
              <Route path="auditoria" element={<ProtectedRoute requiredRole={['superadmin']}><AuditoriaPage /></ProtectedRoute>} />
              <Route path="configuracion" element={<ProtectedRoute requiredRole={['admin', 'superadmin']}><ConfiguracionPage /></ProtectedRoute>} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
