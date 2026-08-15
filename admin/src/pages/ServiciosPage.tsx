import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../components/ui/feedback';
import { Loader2, Edit2, ArrowUp, ArrowDown, X, Check, UploadCloud, Image as ImageIcon, Plus, Sparkles, RefreshCw } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  ordenVisualizacion: number;
}

const defaultServicesData = [
  {
    id: 'servicio-1',
    nombre: 'Decoración de eventos',
    descripcion: 'Ambientación, montaje y decoración que reflejan tu estilo y hacen único cada detalle.',
    imagenUrl: '/images/extracted/img_9.jpeg',
    ordenVisualizacion: 1,
  },
  {
    id: 'servicio-2',
    nombre: 'Mobiliario y menaje',
    descripcion: 'Mesas, sillas, vajilla, manteles, cubiertos y complementos para tu montaje.',
    imagenUrl: '/images/extracted/img_10.jpeg',
    ordenVisualizacion: 2,
  },
  {
    id: 'servicio-3',
    nombre: 'Banquetería & catering',
    descripcion: 'Menús personalizados con presentación cuidada y opciones pensadas para tu celebración.',
    imagenUrl: '/images/extracted/img_11.jpeg',
    ordenVisualizacion: 3,
  },
];

/**
 * Comprime imágenes de servicios antes de guardar en Firestore
 */
const compressImage = (file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.8): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      const fallbackReader = new FileReader();
      fallbackReader.onloadend = () => resolve(fallbackReader.result as string);
      fallbackReader.readAsDataURL(file);
    };
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    reader.readAsDataURL(file);
  });
};

const SERVICE_IMAGE_WARNING_BYTES = 250 * 1024;

export default function ServiciosPage() {
  const { userData } = useAuth();
  const { toast, confirm } = useFeedback();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: '', descripcion: '', imagenUrl: '' });
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({ nombre: '', descripcion: '', imagenUrl: '/images/extracted/img_9.jpeg' });

  const editFileInputRef = useRef<HTMLInputElement>(null);
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const seedDefaultServices = useCallback(async (showSuccessToast = false) => {
    setSeeding(true);
    try {
      for (const s of defaultServicesData) {
        await setDoc(doc(db, 'servicios', s.id), s);
      }
      if (showSuccessToast) {
        toast({ type: 'success', message: 'Servicios iniciales restablecidos correctamente.' });
      }
    } catch (err) {
      console.error('Error al sembrar servicios iniciales:', err);
      toast({ type: 'error', message: 'No se pudieron restablecer los servicios iniciales.' });
    } finally {
      setSeeding(false);
    }
  }, [toast]);

  const handleSeedDefaultServices = async () => {
    const accepted = await confirm({
      title: 'Restablecer servicios iniciales',
      message: 'Esto volverá a cargar los 3 servicios base y puede reemplazar textos o imágenes de esos servicios. ¿Quieres continuar?',
      confirmLabel: 'Restablecer',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });

    if (!accepted) return;
    await seedDefaultServices(true);
  };

  useEffect(() => {
    const q = query(collection(db, 'servicios'), orderBy('ordenVisualizacion', 'asc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Si la colección está vacía en Firestore, sembrar los 3 servicios iniciales automáticamente
        await seedDefaultServices();
      } else {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Servicio));
        setServicios(data);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error al cargar servicios:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [seedDefaultServices]);

  const handleEditClick = (servicio: Servicio) => {
    setEditingId(servicio.id);
    setEditForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      imagenUrl: servicio.imagenUrl || '/images/extracted/img_9.jpeg',
    });
  };

  const handleFileSelected = async (file: File, isNew = false) => {
    if (!file.type.startsWith('image/')) {
      toast({ type: 'warning', message: 'Por favor selecciona un archivo de imagen válido.' });
      return;
    }
    setProcessingImage(true);
    try {
      const compressed = await compressImage(file, 1200, 1200, 0.8);
      const compressedSize = getDataUrlByteSize(compressed);
      if (isNew) {
        setNewForm(prev => ({ ...prev, imagenUrl: compressed }));
      } else {
        setEditForm(prev => ({ ...prev, imagenUrl: compressed }));
      }
      toast({
        type: compressedSize > SERVICE_IMAGE_WARNING_BYTES ? 'warning' : 'success',
        message: compressedSize > SERVICE_IMAGE_WARNING_BYTES
          ? `Imagen optimizada a ${formatBytes(compressedSize)}. Funciona, pero conviene usar una foto más liviana.`
          : `Imagen optimizada a ${formatBytes(compressedSize)}.`,
      });
    } catch (err) {
      console.error('Error al procesar imagen de servicio:', err);
      toast({ type: 'error', message: 'Ocurrió un error al procesar la imagen del servicio.' });
    } finally {
      setProcessingImage(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingId || !userData) return;
    setSaving(true);
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
      toast({ type: 'success', message: 'Servicio actualizado correctamente.' });
    } catch (error) {
      console.error(error);
      toast({ type: 'error', message: 'Error al guardar servicio.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.nombre.trim() || !userData) return;
    setSaving(true);
    try {
      const newOrder = servicios.length + 1;
      await addDoc(collection(db, 'servicios'), {
        nombre: newForm.nombre.trim(),
        descripcion: newForm.descripcion.trim(),
        imagenUrl: newForm.imagenUrl,
        ordenVisualizacion: newOrder,
      });

      await addDoc(collection(db, 'auditoria'), {
        usuarioId: userData.uid,
        usuarioEmail: userData.email,
        accion: 'servicio.crear',
        detalle: `Nuevo servicio creado: ${newForm.nombre}`,
        fecha: new Date()
      });

      setShowAddModal(false);
      setNewForm({ nombre: '', descripcion: '', imagenUrl: '/images/extracted/img_9.jpeg' });
      toast({ type: 'success', message: 'Servicio creado correctamente.' });
    } catch (err) {
      console.error('Error al crear servicio:', err);
      toast({ type: 'error', message: 'Error al crear el nuevo servicio.' });
    } finally {
      setSaving(false);
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

  if (loading || seeding) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
        <p className="text-xs text-gray-500 font-medium">
          {seeding ? 'Inicializando servicios de RMC Eventos...' : 'Cargando servicios...'}
        </p>
      </div>
    );
  }

  const canEdit = userData?.rol === 'admin' || userData?.rol === 'superadmin';

  return (
    <div className="space-y-6">
      {/* File Inputs hidden */}
      <input
        type="file"
        ref={editFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0], false);
          }
        }}
      />
      <input
        type="file"
        ref={addFileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelected(e.target.files[0], true);
          }
        }}
      />

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white">Gestión de Servicios</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Edita los títulos, descripciones e imágenes representativas de cada servicio</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <button
              onClick={handleSeedDefaultServices}
              className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              title="Restablecer los 3 servicios iniciales"
            >
              <RefreshCw size={14} />
              Restablecer Iniciales
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b8952d] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              Agregar Servicio
            </button>
          </div>
        )}
      </div>
      
      {!canEdit && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">No tienes permisos para editar los servicios. Modo solo lectura.</p>
        </div>
      )}

      {servicios.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
          <Sparkles className="mx-auto text-[#D4AF37]" size={40} />
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No hay servicios registrados aún</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Puedes cargar los 3 servicios iniciales recomendados de RMC Eventos o crear uno nuevo.
          </p>
          <button
            onClick={() => seedDefaultServices(true)}
            className="bg-[#D4AF37] hover:bg-[#b8952d] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow transition-all cursor-pointer"
          >
            Cargar Servicios Iniciales
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {servicios.map((servicio, index) => {
            const displayImg = servicio.imagenUrl || defaultServicesData[index % 3]?.imagenUrl || '/images/extracted/img_9.jpeg';

            return (
              <div key={servicio.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex flex-col md:flex-row items-start gap-5">
                
                {/* Order Controls */}
                {canEdit && (
                  <div className="flex md:flex-col gap-1 self-center md:self-start">
                    <button 
                      disabled={index === 0}
                      onClick={() => handleReorder(index, 'up')}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      title="Subir orden"
                    >
                      <ArrowUp size={18} />
                    </button>
                    <button 
                      disabled={index === servicios.length - 1}
                      onClick={() => handleReorder(index, 'down')}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-30 transition-colors rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                      title="Bajar orden"
                    >
                      <ArrowDown size={18} />
                    </button>
                  </div>
                )}

                {/* Service Preview Image */}
                <div className="w-full md:w-52 shrink-0">
                  <div className="h-36 rounded-xl overflow-hidden bg-gray-900 relative border border-gray-200 dark:border-gray-700 group">
                  <img 
                    src={editingId === servicio.id ? (editForm.imagenUrl || displayImg) : displayImg} 
                    alt={servicio.nombre} 
                    className="w-full h-full object-cover block" 
                  />
                  {editingId === servicio.id && (
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      disabled={processingImage}
                      className="absolute inset-0 bg-black/60 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      {processingImage ? <Loader2 size={20} className="animate-spin text-[#D4AF37]" /> : <UploadCloud size={20} className="text-[#D4AF37]" />}
                      {processingImage ? 'Procesando...' : 'Cambiar Imagen desde tu Equipo'}
                    </button>
                  )}
                  </div>
                  {editingId === servicio.id && isImageDataUrl(editForm.imagenUrl) && (
                    <p className="mt-2 text-[0.7rem] font-medium text-gray-500 dark:text-gray-400">
                      Peso optimizado: {formatBytes(getDataUrlByteSize(editForm.imagenUrl))}
                    </p>
                  )}
                </div>

                {/* Service Details Form or View */}
                <div className="flex-1 min-w-0 w-full">
                  {editingId === servicio.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                          Nombre del servicio
                        </label>
                        <input 
                          type="text" 
                          value={editForm.nombre} 
                          onChange={e => setEditForm({...editForm, nombre: e.target.value})}
                          className="w-full p-2.5 border font-bold text-sm border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                          Descripción del servicio
                        </label>
                        <textarea 
                          value={editForm.descripcion} 
                          onChange={e => setEditForm({...editForm, descripcion: e.target.value})}
                          className="w-full p-2.5 border text-xs border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
                          rows={3}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          className="text-xs text-[#D4AF37] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ImageIcon size={14} />
                          Subir nueva foto representativa desde tu equipo o celular
                        </button>

                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingId(null)} 
                            className="flex items-center gap-1 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 text-xs font-bold cursor-pointer"
                          >
                            <X size={14} /> Cancelar
                          </button>
                          <button 
                            onClick={handleSaveEdit} 
                            disabled={saving || processingImage}
                            className="flex items-center gap-1 bg-[#D4AF37] hover:bg-[#b8952d] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="text-xl font-bold text-[#D4AF37]">{servicio.nombre}</h2>
                        {canEdit && (
                          <button 
                            onClick={() => handleEditClick(servicio)} 
                            className="text-gray-400 hover:text-[#D4AF37] transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-1 text-xs font-bold"
                          >
                            <Edit2 size={16} />
                            <span>Editar</span>
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">{servicio.descripcion}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Agregar Nuevo Servicio */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold font-poppins text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-[#D4AF37]" />
                Agregar Nuevo Servicio
              </h2>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del servicio
                </label>
                <input
                  type="text"
                  required
                  value={newForm.nombre}
                  onChange={e => setNewForm({...newForm, nombre: e.target.value})}
                  placeholder="Ej: Organización Integral"
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </label>
                <textarea
                  required
                  value={newForm.descripcion}
                  onChange={e => setNewForm({...newForm, descripcion: e.target.value})}
                  placeholder="Describe en qué consiste este servicio..."
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37]"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1">
                  Imagen representativa
                </label>
                <div className="relative rounded-xl overflow-hidden h-36 bg-gray-900 border border-gray-200 dark:border-gray-700 mb-2">
                  <img src={newForm.imagenUrl} alt="Vista previa" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => addFileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/50 hover:bg-black/60 text-white text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                  >
                    <UploadCloud size={20} className="text-[#D4AF37]" />
                    <span>Seleccionar Foto desde tu equipo</span>
                  </button>
                </div>
                {isImageDataUrl(newForm.imagenUrl) && (
                  <p className="text-[0.7rem] font-medium text-gray-500 dark:text-gray-400">
                    Peso optimizado: {formatBytes(getDataUrlByteSize(newForm.imagenUrl))}
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-2/3 bg-[#D4AF37] hover:bg-[#b8952d] text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {saving ? 'Guardando...' : 'Crear Servicio'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}

function isImageDataUrl(value: string) {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/.test(value);
}

function getDataUrlByteSize(value: string) {
  const base64 = value.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}
