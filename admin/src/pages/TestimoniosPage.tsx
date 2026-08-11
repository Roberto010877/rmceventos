import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Check, X as XIcon, MessageSquare, Loader2 } from 'lucide-react';

interface Testimonio {
  id: string;
  nombreCliente: string;
  tipoEvento: string;
  mensaje: string;
  fecha: any;
  aprobado: boolean;
}

export default function TestimoniosPage() {
  const { userData } = useAuth();
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pendientes' | 'aprobados'>('pendientes');

  useEffect(() => {
    const q = query(collection(db, 'testimonios'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Testimonio));
      setTestimonios(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, aprobado: boolean) => {
    try {
      await updateDoc(doc(db, 'testimonios', id), { aprobado });
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: aprobado ? 'testimonio.aprobar' : 'testimonio.rechazar',
          entidadId: id,
          detalle: `Testimonio ${aprobado ? 'aprobado' : 'desaprobado'}`,
          fecha: new Date()
        });
      }
    } catch (error) {
      console.error("Error updating testimonio:", error);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  const pendientes = testimonios.filter(t => !t.aprobado);
  const aprobados = testimonios.filter(t => t.aprobado);
  const displayed = tab === 'pendientes' ? pendientes : aprobados;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Testimonios</h1>

      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTab('pendientes')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            tab === 'pendientes' 
              ? 'border-[#D4AF37] text-[#D4AF37]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Pendientes
          {pendientes.length > 0 && (
            <span className="ml-2 bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full">
              {pendientes.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('aprobados')}
          className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
            tab === 'aprobados' 
              ? 'border-[#D4AF37] text-[#D4AF37]' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Aprobados
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <MessageSquare className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">
            No hay testimonios {tab === 'pendientes' ? 'pendientes de aprobación' : 'aprobados'}.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map(t => (
            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t.nombreCliente}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{t.tipoEvento}</p>
                </div>
                {t.fecha && (
                  <span className="text-xs text-gray-400">
                    {new Date(t.fecha?.seconds * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-6 italic">"{t.mensaje}"</p>
              
              <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700 pt-4">
                {tab === 'pendientes' ? (
                  <>
                    <button 
                      onClick={() => handleStatusChange(t.id, true)}
                      className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1.5 rounded hover:bg-green-100 transition-colors text-sm font-medium"
                    >
                      <Check size={16} /> Aprobar
                    </button>
                    <button 
                      onClick={() => handleStatusChange(t.id, false)} // Or could delete, but let's just keep as false for now
                      className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <XIcon size={16} /> Rechazar
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleStatusChange(t.id, false)}
                    className="flex items-center gap-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                  >
                    <XIcon size={16} /> Revocar aprobación
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
