import { useState, useEffect } from 'react';
import { Edit3, X, Eye, EyeOff, LayoutGrid, Star, Loader2, Save } from 'lucide-react';
import type { Foto } from '../../types/photo';
import { useFeedback } from '../ui/feedback';

interface PhotoEditModalProps {
  foto: Foto | null;
  onClose: () => void;
  onSave: (
    id: string,
    data: {
      categoria: string;
      descripcion: string;
      destacada: boolean;
      visible: boolean;
      mostrarEnNosotros: boolean;
    }
  ) => Promise<void>;
}

export const PhotoEditModal: React.FC<PhotoEditModalProps> = ({
  foto,
  onClose,
  onSave,
}) => {
  const { toast } = useFeedback();
  const [editCategoria, setEditCategoria] = useState('decoracion');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editDestacada, setEditDestacada] = useState(false);
  const [editVisible, setEditVisible] = useState(true);
  const [editMostrarEnNosotros, setEditMostrarEnNosotros] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (foto) {
      setEditCategoria(foto.categoria || 'decoracion');
      setEditDescripcion(foto.descripcion || '');
      setEditDestacada(!!foto.destacada);
      setEditVisible(foto.visible !== false);
      setEditMostrarEnNosotros(!!foto.mostrarEnNosotros);
    }
  }, [foto]);

  if (!foto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      await onSave(foto.id, {
        categoria: editCategoria,
        descripcion: editDescripcion,
        destacada: editDestacada,
        visible: editVisible,
        mostrarEnNosotros: editMostrarEnNosotros,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar edición:', error);
      toast({ type: 'error', message: 'Ocurrió un error al actualizar los datos de la foto.' });
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold font-poppins text-gray-900 dark:text-white flex items-center gap-2">
            <Edit3 size={18} className="text-[#D4AF37]" />
            Editar Datos de la Foto
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative rounded-xl overflow-hidden h-40 bg-gray-900 border border-gray-200 dark:border-gray-700">
            <img src={foto.url} alt="Vista previa" className="w-full h-full object-cover" />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Categoría
            </label>
            <select
              value={editCategoria}
              onChange={(e) => setEditCategoria(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="decoracion">Decoración</option>
              <option value="mobiliario">Mobiliario</option>
              <option value="banqueteria">Banquetería</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
              Descripción / Título (Opcional)
            </label>
            <textarea
              value={editDescripcion}
              onChange={(e) => setEditDescripcion(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
              rows={3}
              placeholder="Escribe un título o descripción para la foto..."
            />
          </div>

          {/* Checkboxes: Visibilidad, Nosotros & Destacada */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="editVisible"
                checked={editVisible}
                onChange={(e) => setEditVisible(e.target.checked)}
                className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="editVisible"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1.5"
              >
                {editVisible ? (
                  <Eye size={14} className="text-emerald-500" />
                ) : (
                  <EyeOff size={14} className="text-amber-500" />
                )}
                {editVisible ? 'Publicada (Visible en la landing)' : 'Oculta (No se muestra en la landing)'}
              </label>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="editNosotros"
                checked={editMostrarEnNosotros}
                onChange={(e) => setEditMostrarEnNosotros(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-600 border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="editNosotros"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1.5"
              >
                <LayoutGrid
                  size={14}
                  className={editMostrarEnNosotros ? 'text-purple-600' : 'text-gray-400'}
                />
                Mostrar en el carrusel de "Nosotros"
              </label>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="editDestacada"
                checked={editDestacada}
                onChange={(e) => setEditDestacada(e.target.checked)}
                className="h-4 w-4 text-[#D4AF37] focus:ring-[#D4AF37] border-gray-300 rounded cursor-pointer"
              />
              <label
                htmlFor="editDestacada"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer flex items-center gap-1.5"
              >
                <Star
                  size={14}
                  className={editDestacada ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-gray-400'}
                />
                Marcar como Destacada / Favorita
              </label>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="w-2/3 bg-[#D4AF37] hover:bg-[#b8952d] text-white py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {savingEdit ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
