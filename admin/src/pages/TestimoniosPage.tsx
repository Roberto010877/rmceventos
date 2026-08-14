import { useState, useEffect, type FormEvent } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Check, X as XIcon, MessageSquare, Loader2, Plus, Star, Trash2 } from 'lucide-react';

interface Testimonio {
  id: string;
  nombreCliente: string;
  tipoEvento: string;
  mensaje: string;
  calificacion?: number;
  fecha: any;
  aprobado: boolean;
}

export default function TestimoniosPage() {
  const { userData } = useAuth();
  const [testimonios, setTestimonios] = useState<Testimonio[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pendientes' | 'aprobados'>('pendientes');

  // Modal para agregar testimonio manual desde admin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rating, setRating] = useState(5);
  const [formData, setFormData] = useState({
    nombreCliente: '',
    tipoEvento: 'Boda',
    mensaje: '',
  });

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

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente este testimonio?')) return;
    try {
      await deleteDoc(doc(db, 'testimonios', id));
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'testimonio.eliminar',
          entidadId: id,
          detalle: 'Testimonio eliminado permanentemente',
          fecha: new Date()
        });
      }
    } catch (error) {
      console.error('Error deleting testimonio:', error);
    }
  };

  const handleCreateTestimonio = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'testimonios'), {
        nombreCliente: formData.nombreCliente.trim(),
        tipoEvento: formData.tipoEvento.trim(),
        mensaje: formData.mensaje.trim(),
        calificacion: rating,
        aprobado: true, // Creado por admin nace aprobado automáticamente
        fecha: serverTimestamp(),
      });

      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'testimonio.crear_manual',
          detalle: `Testimonio creado manualmente para ${formData.nombreCliente}`,
          fecha: new Date()
        });
      }

      setIsModalOpen(false);
      setFormData({ nombreCliente: '', tipoEvento: 'Boda', mensaje: '' });
      setRating(5);
    } catch (err) {
      console.error('Error al crear testimonio:', err);
      alert('Ocurrió un error al crear el testimonio.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  const pendientes = testimonios.filter(t => !t.aprobado);
  const aprobados = testimonios.filter(t => t.aprobado);
  const displayed = tab === 'pendientes' ? pendientes : aprobados;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Testimonios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Modera reseñas recibidas de clientes o añade testimonios directamente</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b8952d] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm cursor-pointer"
        >
          <Plus size={18} />
          <span>Crear Testimonio</span>
        </button>
      </div>

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
          Aprobados ({aprobados.length})
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
            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t.nombreCliente}</h3>
                    <p className="text-xs text-[#D4AF37] font-medium capitalize">{t.tipoEvento}</p>
                  </div>
                  {t.fecha && (
                    <span className="text-xs text-gray-400">
                      {new Date(t.fecha?.seconds * 1000).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex gap-1 mb-3">
                  {Array.from({ length: t.calificacion || 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" />
                  ))}
                </div>

                <p className="text-gray-700 dark:text-gray-300 text-sm mb-4 italic leading-relaxed">"{t.mensaje}"</p>
              </div>

              <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-4 mt-auto">
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Eliminar testimonio"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex gap-2">
                  {tab === 'pendientes' ? (
                    <>
                      <button 
                        onClick={() => handleStatusChange(t.id, true)}
                        className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Check size={14} /> Aprobar y Publicar
                      </button>
                      <button 
                        onClick={() => handleStatusChange(t.id, false)}
                        className="flex items-center gap-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        <XIcon size={14} /> Rechazar
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => handleStatusChange(t.id, false)}
                      className="flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors"
                    >
                      <XIcon size={14} /> Desactivar de la web
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Testimonio Manual desde Admin */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">➕ Crear Nuevo Testimonio</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <XIcon size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTestimonio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: María Fernanda L."
                  value={formData.nombreCliente}
                  onChange={(e) => setFormData({ ...formData, nombreCliente: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo de Evento</label>
                <select
                  value={formData.tipoEvento}
                  onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm"
                >
                  <option>Boda</option>
                  <option>Cumpleaños</option>
                  <option>Quinceañero</option>
                  <option>Aniversario</option>
                  <option>Evento Corporativo</option>
                  <option>Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Calificación</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        size={22}
                        className={star <= rating ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-300 dark:text-gray-600'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mensaje / Reseña del Cliente</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Escribe la reseña o comentario recibido del cliente..."
                  value={formData.mensaje}
                  onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-bold bg-[#D4AF37] hover:bg-[#b8952d] text-white rounded-lg flex items-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Guardar y Publicar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
