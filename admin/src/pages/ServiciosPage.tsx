import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Edit2, ArrowUp, ArrowDown, X, Check } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  ordenVisualizacion: number;
}

export default function ServiciosPage() {
  const { userData } = useAuth();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', descripcion: '' });

  useEffect(() => {
    const q = query(collection(db, 'servicios'), orderBy('ordenVisualizacion', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Servicio));
      setServicios(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleEditClick = (servicio: Servicio) => {
    setEditingId(servicio.id);
    setEditForm({ nombre: servicio.nombre, descripcion: servicio.descripcion });
  };

  const handleSaveEdit = async () => {
    if (!editingId || !userData) return;
    try {
      await updateDoc(doc(db, 'servicios', editingId), editForm);
      await addDoc(collection(db, 'auditoria'), {
        usuarioId: userData.uid,
        usuarioEmail: userData.email,
        accion: 'servicio.editar',
        entidadId: editingId,
        detalle: `Servicio actualizado: ${editForm.nombre}`,
        fecha: new Date()
      });
      setEditingId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleReorder = async (currentIndex: number, direction: 'up' | 'down') => {
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === servicios.length - 1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const currentSvc = servicios[currentIndex];
    const targetSvc = servicios[targetIndex];

    try {
      await updateDoc(doc(db, 'servicios', currentSvc.id), { ordenVisualizacion: targetSvc.ordenVisualizacion });
      await updateDoc(doc(db, 'servicios', targetSvc.id), { ordenVisualizacion: currentSvc.ordenVisualizacion });
      
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'servicio.reordenar',
          detalle: `Servicios reordenados`,
          fecha: new Date()
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  // Render logic ensuring only admin/superadmin see actions properly, though the prompt says admin+ only
  const canEdit = userData?.rol === 'admin' || userData?.rol === 'superadmin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Servicios</h1>
      </div>
      
      {!canEdit && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">No tienes permisos para editar los servicios. Solo visible.</p>
        </div>
      )}

      <div className="grid gap-6">
        {servicios.map((servicio, index) => (
          <div key={servicio.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex items-start gap-4">
            
            {canEdit && (
              <div className="flex flex-col gap-1 mt-1">
                <button 
                  disabled={index === 0}
                  onClick={() => handleReorder(index, 'up')}
                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ArrowUp size={18} />
                </button>
                <button 
                  disabled={index === servicios.length - 1}
                  onClick={() => handleReorder(index, 'down')}
                  className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors"
                >
                  <ArrowDown size={18} />
                </button>
              </div>
            )}

            <div className="flex-1">
              {editingId === servicio.id ? (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={editForm.nombre} 
                    onChange={e => setEditForm({...editForm, nombre: e.target.value})}
                    className="w-full p-2 border font-bold text-lg border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <textarea 
                    value={editForm.descripcion} 
                    onChange={e => setEditForm({...editForm, descripcion: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSaveEdit} className="flex items-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 text-sm">
                      <Check size={16} /> Guardar
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 text-sm">
                      <X size={16} /> Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-bold text-[#D4AF37] mb-2">{servicio.nombre}</h2>
                    {canEdit && (
                      <button onClick={() => handleEditClick(servicio)} className="text-gray-400 hover:text-[#D4AF37] transition-colors p-1">
                        <Edit2 size={18} />
                      </button>
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{servicio.descripcion}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
