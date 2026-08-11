import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Image as ImageIcon, Loader2, X } from 'lucide-react';

interface Foto {
  id: string;
  url: string;
  categoria: string;
  estadoProcesamiento: string;
  fechaSubida: any;
  subidoPor: string;
  descripcion?: string;
  destacada?: boolean;
}

export default function FotosPage() {
  const { userData } = useAuth();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('todas');
  
  // Form state
  const [url, setUrl] = useState('');
  const [categoria, setCategoria] = useState('decoracion');
  const [descripcion, setDescripcion] = useState('');
  const [destacada, setDestacada] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'fotos'), orderBy('fechaSubida', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Foto));
      setFotos(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'fotos'), {
        url,
        categoria,
        descripcion,
        destacada,
        estadoProcesamiento: 'listo',
        fechaSubida: new Date(),
        subidoPor: userData.uid
      });
      await addDoc(collection(db, 'auditoria'), {
        usuarioId: userData.uid,
        usuarioEmail: userData.email,
        accion: 'foto.crear',
        detalle: `Foto creada en categoría ${categoria}`,
        fecha: new Date()
      });
      setShowModal(false);
      setUrl('');
      setDescripcion('');
      setDestacada(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta foto?')) {
      await deleteDoc(doc(db, 'fotos', id));
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'foto.eliminar',
          entidadId: id,
          detalle: 'Foto eliminada',
          fecha: new Date()
        });
      }
    }
  };

  const filteredFotos = filter === 'todas' ? fotos : fotos.filter(f => f.categoria === filter);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Fotos</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#D4AF37] text-white px-4 py-2 rounded-lg hover:bg-[#b8952d] transition-colors"
        >
          <Plus size={20} />
          Subir foto
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['todas', 'decoracion', 'mobiliario', 'banqueteria'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap capitalize ${
              filter === cat 
                ? 'bg-[#D4AF37] text-white' 
                : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredFotos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500 dark:text-gray-400">No hay fotos en esta categoría</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredFotos.map(foto => (
            <div key={foto.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden group">
              <div className="relative aspect-square">
                <img src={foto.url} alt={foto.descripcion} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    foto.estadoProcesamiento === 'listo' ? 'bg-green-100 text-green-800' :
                    foto.estadoProcesamiento === 'procesando' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {foto.estadoProcesamiento}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-[#D4AF37] capitalize">{foto.categoria}</span>
                  {userData?.rol === 'admin' || userData?.rol === 'superadmin' ? (
                    <button 
                      onClick={() => handleDelete(foto.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  ) : null}
                </div>
                {foto.descripcion && <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{foto.descripcion}</p>}
                {foto.destacada && <span className="inline-block mt-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Destacada</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Subir Foto</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL de la imagen</label>
                <input 
                  type="url" 
                  required 
                  value={url} 
                  onChange={e => setUrl(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://ejemplo.com/foto.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                <select 
                  value={categoria} 
                  onChange={e => setCategoria(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="decoracion">Decoración</option>
                  <option value="mobiliario">Mobiliario</option>
                  <option value="banqueteria">Banquetería</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción (Opcional)</label>
                <textarea 
                  value={descripcion} 
                  onChange={e => setDescripcion(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="destacada"
                  checked={destacada} 
                  onChange={e => setDestacada(e.target.checked)}
                  className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 rounded"
                />
                <label htmlFor="destacada" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Marcar como destacada
                </label>
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className="w-full bg-[#D4AF37] text-white py-2 px-4 rounded-md hover:bg-[#b8952d] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Guardar foto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
