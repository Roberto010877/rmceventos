import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  Calendar, 
  MessageSquare, 
  Mail, 
  Wrench, 
  Users, 
  Shield, 
  Settings,
  LogOut, 
  Sun, 
  Moon,
  Menu
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [isDarkMode]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['editor', 'admin', 'superadmin'], bottomNav: true },
    { name: 'Fotos', path: '/fotos', icon: ImageIcon, roles: ['editor', 'admin', 'superadmin'], bottomNav: true },
    { name: 'Eventos', path: '/eventos', icon: Calendar, roles: ['editor', 'admin', 'superadmin'], bottomNav: false },
    { name: 'Testimonios', path: '/testimonios', icon: MessageSquare, roles: ['admin', 'superadmin'], bottomNav: true },
    { name: 'Contactos', path: '/contactos', icon: Mail, roles: ['admin', 'superadmin'], bottomNav: true },
    { name: 'Servicios', path: '/servicios', icon: Wrench, roles: ['admin', 'superadmin'], bottomNav: false },
    { name: 'Usuarios', path: '/usuarios', icon: Users, roles: ['superadmin'], bottomNav: false },
    { name: 'Auditoría', path: '/auditoria', icon: Shield, roles: ['superadmin'], bottomNav: false },
    { name: 'Configuración', path: '/configuracion', icon: Settings, roles: ['admin', 'superadmin'], bottomNav: false },
  ];

  const allowedNavItems = navItems.filter(item => 
    userData?.rol && item.roles.includes(userData.rol)
  );

  const bottomNavItems = allowedNavItems.filter(item => item.bottomNav).slice(0, 4);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] shadow-sm">
        <div className="p-6 flex items-center justify-between border-b border-[var(--border-color)]">
          <h1 className="text-xl font-poppins font-bold text-dorado tracking-wide">RMC EVENTOS</h1>
        </div>
        
        <div className="p-4 flex items-center space-x-3 border-b border-[var(--border-color)]">
          <div className="w-10 h-10 rounded-full bg-dorado flex items-center justify-center text-blanco font-bold">
            {userData?.nombre?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-[var(--text-primary)]">{userData?.nombre}</p>
            <p className="text-xs text-[var(--text-secondary)] capitalize">{userData?.rol}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {allowedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-dorado/10 text-dorado font-medium' 
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-dorado' : ''} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)] space-y-2">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)] transition-colors"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pb-16 md:pb-0">
        <header className="md:hidden bg-[var(--bg-secondary)] border-b border-[var(--border-color)] p-4 flex justify-between items-center z-10 shadow-sm">
          <h1 className="text-lg font-poppins font-bold text-dorado">RMC EVENTOS</h1>
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-[var(--text-secondary)]">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[var(--text-primary)]">
              <Menu size={24} />
            </button>
          </div>
        </header>
        
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-[61px] left-0 right-0 bottom-16 bg-[var(--bg-secondary)] z-20 flex flex-col p-4 shadow-lg overflow-y-auto">
            <div className="flex items-center space-x-3 mb-6 p-2 bg-[var(--bg-primary)] rounded-lg">
              <div className="w-10 h-10 rounded-full bg-dorado flex items-center justify-center text-blanco font-bold">
            {userData?.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{userData?.nombre}</p>
                <p className="text-xs text-[var(--text-secondary)] capitalize">{userData?.rol}</p>
              </div>
            </div>
            <nav className="flex-1 space-y-2">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
                      isActive ? 'bg-dorado/10 text-dorado' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 mt-4 rounded-lg text-red-500 bg-red-500/10"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex justify-around items-center p-2 z-10 pb-safe">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full py-1 ${
                isActive ? 'text-dorado' : 'text-[var(--text-secondary)]'
              }`}
            >
              <Icon size={24} className="mb-1" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;
