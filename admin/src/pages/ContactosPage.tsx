import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Mail, Loader2, CheckCircle2, Circle } from 'lucide-react';

interface Contacto {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  tipoEvento: string;
  mensaje: string;
  fecha: any;
  atendido: boolean;
}

export default function ContactosPage() {
  const { userData } = useAuth();
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'nuevos' | 'atendidos'>('todos');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'contactos'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Contacto));
      setContactos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const toggleAtendido = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, 'contactos', id), { atendido: !currentStatus });
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'contacto.actualizar',
          entidadId: id,
          detalle: `Contacto marcado como ${!currentStatus ? 'atendido' : 'no atendido'}`,
          fecha: new Date()
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredContactos = contactos.filter(c => {
    if (filter === 'nuevos') return !c.atendido;
    if (filter === 'atendidos') return c.atendido;
    return true;
  });

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mensajes de Contacto</h1>
        
        <select 
          value={filter} 
          onChange={e => setFilter(e.target.value as any)}
          className="p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        >
          <option value="todos">Todos los mensajes</option>
          <option value="nuevos">Sin atender</option>
          <option value="atendidos">Atendidos</option>
        </select>
      </div>

      {filteredContactos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Mail className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No hay mensajes de contacto</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredContactos.map(contacto => (
              <div 
                key={contacto.id} 
                className={`p-4 cursor-pointer transition-colors ${!contacto.atendido ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-750'}`}
                onClick={() => setExpandedId(expandedId === contacto.id ? null : contacto.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4">
                    <button 
                      onClick={(e) => toggleAtendido(e, contacto.id, contacto.atendido)}
                      className="mt-1 flex-shrink-0 focus:outline-none"
                    >
                      {contacto.atendido ? (
                        <CheckCircle2 className="text-green-500" size={20} />
                      ) : (
                        <Circle className="text-[#D4AF37]" size={20} />
                      )}
                    </button>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {contacto.nombre}
                        {!contacto.atendido && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#D4AF37] text-white">
                            Nuevo
                          </span>
                        )}
                      </h3>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        <span>{contacto.correo}</span>
                        <span>{contacto.telefono}</span>
                        <span className="capitalize text-[#D4AF37]">{contacto.tipoEvento}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                    {contacto.fecha && new Date(contacto.fecha?.seconds * 1000).toLocaleDateString()}
                  </div>
                </div>

                {expandedId === contacto.id && (
                  <div className="mt-4 ml-9 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                    <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{contacto.mensaje}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
