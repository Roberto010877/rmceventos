import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { ImageIcon, MessageSquare, Mail, Calendar, PlusCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    fotos: 0,
    testimoniosPendientes: 0,
    mensajesNoAtendidos: 0,
    eventos: 0,
  });

  useEffect(() => {
    // Escuchar fotos
    const fotosUnsub = onSnapshot(collection(db, 'fotos'), (snapshot) => {
      setStats(prev => ({ ...prev, fotos: snapshot.size }));
    });

    // Escuchar testimonios pendientes
    const testimoniosQuery = query(collection(db, 'testimonios'), where('aprobado', '==', false));
    const testimoniosUnsub = onSnapshot(testimoniosQuery, (snapshot) => {
      setStats(prev => ({ ...prev, testimoniosPendientes: snapshot.size }));
    });

    // Escuchar mensajes no atendidos
    const mensajesQuery = query(collection(db, 'contactos'), where('atendido', '==', false));
    const mensajesUnsub = onSnapshot(mensajesQuery, (snapshot) => {
      setStats(prev => ({ ...prev, mensajesNoAtendidos: snapshot.size }));
    });

    // Escuchar eventos
    const eventosUnsub = onSnapshot(collection(db, 'eventos'), (snapshot) => {
      setStats(prev => ({ ...prev, eventos: snapshot.size }));
    });

    return () => {
      fotosUnsub();
      testimoniosUnsub();
      mensajesUnsub();
      eventosUnsub();
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-poppins font-bold text-[var(--text-primary)]">
          Hola, {userData?.nombre?.split(' ')[0] || 'Administrador'}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Bienvenido al panel de administración de RMC Eventos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          icon={<ImageIcon size={28} className="text-dorado" />}
          title="Total Fotos"
          value={stats.fotos}
        />
        <StatCard 
          icon={<MessageSquare size={28} className="text-dorado" />}
          title="Testimonios Pendientes"
          value={stats.testimoniosPendientes}
          highlight={stats.testimoniosPendientes > 0}
        />
        <StatCard 
          icon={<Mail size={28} className="text-dorado" />}
          title="Mensajes Nuevos"
          value={stats.mensajesNoAtendidos}
          highlight={stats.mensajesNoAtendidos > 0}
        />
        <StatCard 
          icon={<Calendar size={28} className="text-dorado" />}
          title="Total Eventos"
          value={stats.eventos}
        />
      </div>

      <h2 className="text-xl font-poppins font-bold text-[var(--text-primary)] mb-4">
        Acciones Rápidas
      </h2>
      
      <div className="flex flex-wrap gap-4">
        <Link 
          to="/fotos" 
          className="flex items-center gap-2 bg-dorado hover:bg-dorado/90 text-blanco px-5 py-3 rounded-xl font-medium transition-colors shadow-sm"
        >
          <PlusCircle size={20} />
          <span>Subir Foto</span>
        </Link>
        <Link 
          to="/contactos" 
          className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-dorado text-[var(--text-primary)] px-5 py-3 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Eye size={20} />
          <span>Ver Mensajes</span>
        </Link>
        <Link 
          to="/testimonios" 
          className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-dorado text-[var(--text-primary)] px-5 py-3 rounded-xl font-medium transition-colors shadow-sm"
        >
          <MessageSquare size={20} />
          <span>Moderar Testimonios</span>
        </Link>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  highlight?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, highlight }) => {
  return (
    <div className="bg-[var(--bg-secondary)] p-6 rounded-2xl shadow-sm border border-[var(--border-color)] flex items-center space-x-4">
      <div className={`p-3 rounded-xl ${highlight ? 'bg-red-500/10' : 'bg-dorado/10'}`}>
        {icon}
      </div>
      <div>
        <p className="text-[var(--text-secondary)] text-sm font-medium">{title}</p>
        <p className={`text-2xl font-poppins font-bold mt-1 ${highlight ? 'text-red-500' : 'text-[var(--text-primary)]'}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;
