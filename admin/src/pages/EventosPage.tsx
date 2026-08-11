import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Calendar, Loader2, X } from 'lucide-react';

interface Evento {
  id: string;
  nombre: string;
  tipoEvento: string;
  fecha: string;
  clienteNombre: string;
  descripcion: string;
}

export default function EventosPage() {
  const { userData } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    tipoEvento: 'boda',
    fecha: '',
    clienteNombre: '',
    descripcion: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'eventos'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Evento));
      setEventos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (evento?: Evento) => {
    if (evento) {
      setEditingId(evento.id);
      setFormData({
        nombre: evento.nombre,
        tipoEvento: evento.tipoEvento,
        fecha: evento.fecha,
        clienteNombre: evento.clienteNombre,
        descripcion: evento.descripcion
      });
    } else {
      setEditingId(null);
      setFormData({ nombre: '', tipoEvento: 'boda', fecha: '', clienteNombre: '', descripcion: '' });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'eventos', editingId), formData);
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'evento.editar',
          entidadId: editingId,
          detalle: `Evento editado: ${formData.nombre}`,
          fecha: new Date()
        });
      } else {
        const newDoc = await addDoc(collection(db, 'eventos'), formData);
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'evento.crear',
          entidadId: newDoc.id,
          detalle: `Evento creado: ${formData.nombre}`,
          fecha: new Date()
        });
      }
      setShowModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (evento: Evento) => {
    if (window.confirm(`¿Estás seguro de eliminar el evento "${evento.nombre}"?`)) {
      await deleteDoc(doc(db, 'eventos', evento.id));
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'evento.eliminar',
          entidadId: evento.id,
          detalle: `Evento eliminado: ${evento.nombre}`,
          fecha: new Date()
        });
      }
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Eventos</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[#D4AF37] text-white px-4 py-2 rounded-lg hover:bg-[#b8952d] transition-colors"
        >
          <Plus size={20} />
          Crear evento
        </button>
      </div>

      {eventos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No hay eventos registrados</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Nombre</th>
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Tipo</th>
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Fecha</th>
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Cliente</th>
                  <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map(evento => (
                  <tr key={evento.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="p-4 text-sm text-gray-800 dark:text-gray-200 font-medium">{evento.nombre}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 capitalize">{evento.tipoEvento}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{evento.fecha}</td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{evento.clienteNombre}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(evento)} className="text-blue-500 hover:text-blue-700 p-1">
                          <Edit2 size={18} />
                        </button>
                        {(userData?.rol === 'admin' || userData?.rol === 'superadmin') && (
                          <button onClick={() => handleDelete(evento)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">{editingId ? 'Editar Evento' : 'Crear Evento'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Evento</label>
                <input 
                  type="text" required 
                  value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Evento</label>
                <select 
                  value={formData.tipoEvento} onChange={e => setFormData({...formData, tipoEvento: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="boda">Boda</option>
                  <option value="aniversario">Aniversario</option>
                  <option value="corporativo">Corporativo</option>
                  <option value="cumpleanos">Cumpleaños</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                <input 
                  type="date" required 
                  value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Cliente</label>
                <input 
                  type="text" required 
                  value={formData.clienteNombre} onChange={e => setFormData({...formData, clienteNombre: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea 
                  value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-[#D4AF37] text-white py-2 px-4 rounded-md hover:bg-[#b8952d] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
