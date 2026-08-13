import { useState, useRef } from 'react';
import { Layers, X, UploadCloud, Link as LinkIcon, Check, Loader2, CheckCircle2 } from 'lucide-react';
import type { PendingFileItem } from '../../types/photo';
import { compressImage } from '../../utils/compressImage';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitBatch: (
    pendingItems: PendingFileItem[],
    onProgress: (current: number, total: number) => void
  ) => Promise<void>;
}

export const PhotoUploadModal: React.FC<PhotoUploadModalProps> = ({
  isOpen,
  onClose,
  onSubmitBatch,
}) => {
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [pendingItems, setPendingItems] = useState<PendingFileItem[]>([]);
  const [globalCategoria, setGlobalCategoria] = useState('decoracion');
  const [urlInput, setUrlInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [processingFiles, setProcessingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setPendingItems([]);
    setUrlInput('');
    setGlobalCategoria('decoracion');
    setUploadMode('file');
    setUploadProgress({ current: 0, total: 0 });
    setProcessingFiles(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      alert('Por favor selecciona archivos de imagen válidos (PNG, JPG, WEBP).');
      return;
    }

    setProcessingFiles(true);
    try {
      for (const file of validFiles) {
        const compressedDataUrl = await compressImage(file, 1200, 1200, 0.75);
        const tempId = Math.random().toString(36).substring(2, 9);
        setPendingItems((prev) => [
          ...prev,
          {
            id: tempId,
            file,
            previewUrl: compressedDataUrl,
            categoria: globalCategoria,
            descripcion: '',
            destacada: false,
            mostrarEnNosotros: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Error al procesar imágenes:', err);
    } finally {
      setProcessingFiles(false);
    }
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    const tempId = Math.random().toString(36).substring(2, 9);
    setPendingItems((prev) => [
      ...prev,
      {
        id: tempId,
        previewUrl: urlInput.trim(),
        categoria: globalCategoria,
        descripcion: '',
        destacada: false,
        mostrarEnNosotros: false,
      },
    ]);
    setUrlInput('');
  };

  const handleRemovePendingItem = (id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUpdateItemCategory = (id: string, cat: string) => {
    setPendingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, categoria: cat } : item))
    );
  };

  const handleApplyCategoryToAll = (newCat: string) => {
    setGlobalCategoria(newCat);
    setPendingItems((prev) =>
      prev.map((item) => ({ ...item, categoria: newCat }))
    );
  };

  const handleUpdateItemDescription = (id: string, desc: string) => {
    setPendingItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, descripcion: desc } : item))
    );
  };

  const handleToggleItemDestacada = (id: string) => {
    setPendingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, destacada: !item.destacada } : item
      )
    );
  };

  const handleToggleItemNosotros = (id: string) => {
    setPendingItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, mostrarEnNosotros: !item.mostrarEnNosotros } : item
      )
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingItems.length === 0) {
      alert('Por favor agrega al menos una foto para subir.');
      return;
    }

    setSubmitting(true);
    setUploadProgress({ current: 0, total: pendingItems.length });

    try {
      await onSubmitBatch(pendingItems, (current, total) => {
        setUploadProgress({ current, total });
      });

      handleClose();
    } catch (error: any) {
      console.error('Error al guardar lote de fotos:', error);
      alert(`Ocurrió un error al guardar fotos: ${error.message || 'Comprueba tu conexión.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold font-poppins text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="text-[#D4AF37]" size={22} />
              Subida Múltiple de Fotos
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selecciona varias fotos a la vez desde tu equipo o celular
            </p>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setUploadMode('file')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              uploadMode === 'file'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <UploadCloud size={16} className="text-[#D4AF37]" />
            Seleccionar varias fotos (Disco / Celular)
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              uploadMode === 'url'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            <LinkIcon size={16} className="text-[#D4AF37]" />
            Agregar por URL
          </button>
        </div>

        <form onSubmit={handleSubmitBatch} className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Categoría General (Aplicar a las fotos seleccionadas)
              </label>
              {pendingItems.length > 0 && (
                <span className="text-xs font-semibold text-[#D4AF37]">
                  {pendingItems.length} {pendingItems.length === 1 ? 'foto lista' : 'fotos listas'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'decoracion', label: 'Decoración' },
                { id: 'mobiliario', label: 'Mobiliario' },
                { id: 'banqueteria', label: 'Banquetería' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleApplyCategoryToAll(cat.id)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                    globalCategoria === cat.id
                      ? 'bg-[#D4AF37] border-[#D4AF37] text-white shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {globalCategoria === cat.id && <Check size={14} />}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {uploadMode === 'file' ? (
            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFilesSelected(e.target.files);
                  }
                }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-[#D4AF37] dark:hover:border-[#D4AF37] bg-gray-50 dark:bg-gray-900/40'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] flex items-center justify-center shrink-0">
                    {processingFiles ? <Loader2 size={22} className="animate-spin" /> : <UploadCloud size={22} />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      {processingFiles ? 'Optimizando fotos...' : 'Haz clic para seleccionar múltiples fotos desde tu equipo'}
                    </p>
                    <p className="text-[0.7rem] text-gray-400">
                      o arrastra y suelta varias imágenes a la vez (PNG, JPG, WEBP)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mb-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="flex-1 p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                placeholder="https://ejemplo.com/foto.jpg"
              />
              <button
                type="button"
                onClick={handleAddUrl}
                disabled={!urlInput.trim()}
                className="bg-[#D4AF37] hover:bg-[#b8952d] text-white px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                + Agregar URL
              </button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto my-3 pr-1 space-y-3 max-h-[300px]">
            {pendingItems.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                No has seleccionado ninguna foto aún. Haz clic arriba para comenzar.
              </div>
            ) : (
              pendingItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0 relative">
                    <img src={item.previewUrl} alt="Vista previa" className="w-full h-full object-cover" />
                    <span className="absolute top-1 left-1 bg-black/60 text-white text-[0.65rem] px-1.5 py-0.5 rounded font-bold">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      type="text"
                      placeholder="Descripción de esta foto (Opcional)..."
                      value={item.descripcion}
                      onChange={(e) => handleUpdateItemDescription(item.id, e.target.value)}
                      className="w-full text-xs p-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={item.categoria}
                        onChange={(e) => handleUpdateItemCategory(item.id, e.target.value)}
                        className="text-[0.7rem] p-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-medium"
                      >
                        <option value="decoracion">Decoración</option>
                        <option value="mobiliario">Mobiliario</option>
                        <option value="banqueteria">Banquetería</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleToggleItemNosotros(item.id)}
                        className={`text-[0.7rem] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          item.mostrarEnNosotros
                            ? 'bg-purple-600 border-purple-600 text-white font-bold'
                            : 'border-gray-300 text-gray-500 hover:border-purple-600'
                        }`}
                      >
                        🖼️ En Nosotros
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleItemDestacada(item.id)}
                        className={`text-[0.7rem] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          item.destacada
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-white font-bold'
                            : 'border-gray-300 text-gray-500 hover:border-[#D4AF37]'
                        }`}
                      >
                        ★ Destacada
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePendingItem(item.id)}
                    className="text-gray-400 hover:text-red-500 p-1.5 transition-colors shrink-0 cursor-pointer"
                    title="Quitar esta foto"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {submitting && (
            <div className="mb-3">
              <div className="flex justify-between text-xs font-bold mb-1 text-gray-700 dark:text-gray-300">
                <span>Subiendo fotos a la galería...</span>
                <span>
                  {uploadProgress.current} de {uploadProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#D4AF37] h-full transition-all duration-300"
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="w-1/3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting || processingFiles || pendingItems.length === 0}
              className="w-2/3 bg-[#D4AF37] hover:bg-[#b8952d] text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Guardando ({uploadProgress.current}/{uploadProgress.total})...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Publicar {pendingItems.length} {pendingItems.length === 1 ? 'Foto' : 'Fotos'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
