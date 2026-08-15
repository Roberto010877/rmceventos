import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, limit, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Mail, Loader2, CheckCircle2, Circle, Clock, AlertCircle, X, Search, Archive } from 'lucide-react';

interface Contacto {
  id: string;
  nombre: string;
  email?: string;
  correo?: string;
  telefono: string;
  tipoEvento: string;
  mensaje: string;
  fecha?: Timestamp | { seconds: number; nanoseconds?: number } | Date | string | null;
  atendido: boolean;
  estado?: 'nuevo' | 'en_contacto' | 'cerrado';
  source?: string;
}

export default function ContactosPage() {
  const { userData } = useAuth();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'nuevo' | 'en_contacto' | 'cerrado'>('todos');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setErrorMessage(null);
    const q = query(collection(db, 'contactos'), orderBy('fecha', 'desc'), limit(100));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contacto));
        setContactos(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error escuchando contactos de Firestore:', error);
        setErrorMessage('Error al sincronizar con la base de datos de contactos.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const getContactStatus = (contacto: Contacto): 'nuevo' | 'en_contacto' | 'cerrado' => {
    if (contacto.estado === 'cerrado') return 'cerrado';
    if (contacto.estado === 'en_contacto' || contacto.atendido) return 'en_contacto';
    return 'nuevo';
  };

  const getStatusBadge = (estado: 'nuevo' | 'en_contacto' | 'cerrado') => {
    if (estado === 'cerrado') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200">Cerrado</span>;
    }

    if (estado === 'en_contacto') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">En contacto</span>;
    }

    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#D4AF37] text-white">Nuevo</span>;
  };

  const updateContactStatus = async (
    e: React.MouseEvent,
    contacto: Contacto,
    estado: 'nuevo' | 'en_contacto' | 'cerrado'
  ) => {
    e.stopPropagation();
    setErrorMessage(null);
    try {
      await updateDoc(doc(db, 'contactos', contacto.id), {
        atendido: estado !== 'nuevo',
        estado
      });
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'contacto.actualizar',
          entidadId: contacto.id,
          detalle: `Contacto marcado como ${estado}`,
          fecha: new Date()
        });
      }
    } catch (error: any) {
      console.error('Error al actualizar estado del contacto:', error);
      setErrorMessage(error?.message || 'No se pudo actualizar el estado del contacto. Inténtalo de nuevo.');
    }
  };

  const filteredContactos = contactos.filter(c => {
    const estado = getContactStatus(c);
    if (filter !== 'todos' && estado !== filter) return false;

    const queryText = search.trim().toLowerCase();
    if (!queryText) return true;

    return [
      c.nombre,
      c.email,
      c.correo,
      c.telefono,
      c.tipoEvento,
      c.mensaje,
      c.source,
    ].some(value => String(value || '').toLowerCase().includes(queryText));
  });

  const counts = {
    todos: contactos.length,
    nuevo: contactos.filter(c => getContactStatus(c) === 'nuevo').length,
    en_contacto: contactos.filter(c => getContactStatus(c) === 'en_contacto').length,
    cerrado: contactos.filter(c => getContactStatus(c) === 'cerrado').length,
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mensajes de Contacto</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Revisa solicitudes, responde rápido y marca el avance de cada contacto.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, teléfono o mensaje"
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 focus:border-[#D4AF37] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'todos', label: `Todos (${counts.todos})` },
          { id: 'nuevo', label: `Nuevos (${counts.nuevo})` },
          { id: 'en_contacto', label: `En contacto (${counts.en_contacto})` },
          { id: 'cerrado', label: `Cerrados (${counts.cerrado})` },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setFilter(item.id as typeof filter)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
              filter === item.id
                ? 'bg-[#D4AF37] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {errorMessage && (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)} 
            className="text-red-500 hover:text-red-700 dark:hover:text-red-300 p-1"
            title="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {filteredContactos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Mail className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No hay mensajes de contacto</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredContactos.map(contacto => {
              const emailDisplay = contacto.email || contacto.correo || 'Sin correo';
              const estado = getContactStatus(contacto);
              const fechaDate = contacto.fecha 
                ? (typeof contacto.fecha === 'object' && 'seconds' in contacto.fecha 
                    ? new Date(contacto.fecha.seconds * 1000) 
                    : new Date(contacto.fecha as any))
                : null;

              return (
                <div 
                  key={contacto.id} 
                  className={`p-4 cursor-pointer transition-colors ${estado === 'nuevo' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                  onClick={() => setExpandedId(expandedId === contacto.id ? null : contacto.id)}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={(e) => updateContactStatus(e, contacto, estado === 'nuevo' ? 'en_contacto' : 'nuevo')}
                        className="mt-1 flex-shrink-0 focus:outline-none"
                        title={estado === 'nuevo' ? 'Marcar en contacto' : 'Marcar como nuevo'}
                      >
                        {estado !== 'nuevo' ? (
                          <CheckCircle2 className="text-green-500" size={20} />
                        ) : (
                          <Circle className="text-[#D4AF37]" size={20} />
                        )}
                      </button>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          {contacto.nombre}
                          {getStatusBadge(estado)}
                          {contacto.source && (
                            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">
                              [{contacto.source}]
                            </span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span>{emailDisplay}</span>
                          <span>{contacto.telefono}</span>
                          <span className="capitalize text-[#D4AF37] font-medium">{contacto.tipoEvento}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4 flex items-center gap-1">
                      <Clock size={12} />
                      {fechaDate && !isNaN(fechaDate.getTime()) ? fechaDate.toLocaleDateString() : 'Sin fecha'}
                    </div>
                  </div>

                  {expandedId === contacto.id && (
                    <div className="mt-4 ml-9 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border-l-2 border-[#D4AF37]">
                      <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{contacto.mensaje}</p>
                      <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                        <a
                          href={`https://wa.me/${contacto.telefono.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline font-semibold"
                          onClick={e => e.stopPropagation()}
                        >
                          Contactar WhatsApp
                        </a>
                        <span className="text-gray-300">|</span>
                        <a
                          href={`mailto:${emailDisplay}`}
                          className="text-xs text-[#D4AF37] hover:underline font-semibold"
                          onClick={e => e.stopPropagation()}
                        >
                          Responder Email
                        </a>
                        {estado !== 'cerrado' && (
                          <>
                            <span className="text-gray-300">|</span>
                            <button
                              type="button"
                              onClick={e => updateContactStatus(e, contacto, 'cerrado')}
                              className="text-xs text-gray-600 hover:underline font-semibold dark:text-gray-300"
                            >
                              <Archive size={12} className="inline mr-1" />
                              Cerrar solicitud
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
