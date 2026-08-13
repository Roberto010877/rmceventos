import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePhotos } from '../hooks/usePhotos';
import type { Foto, PendingFileItem } from '../types/photo';
import { PhotoFilters } from '../components/photos/PhotoFilters';
import { PhotoGrid } from '../components/photos/PhotoGrid';
import { PhotoUploadModal } from '../components/photos/PhotoUploadModal';
import { PhotoEditModal } from '../components/photos/PhotoEditModal';

export default function FotosPage() {
  const { userData } = useAuth();
  const {
    fotos,
    filteredFotos,
    loading,
    filter,
    setFilter,
    counts,
    toggleVisibility,
    toggleDestacada,
    toggleNosotros,
    updatePhoto,
    deletePhoto,
    uploadBatch,
  } = usePhotos();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingFoto, setEditingFoto] = useState<Foto | null>(null);

  const handleSaveEdit = async (
    id: string,
    data: {
      categoria: string;
      descripcion: string;
      destacada: boolean;
      visible: boolean;
      mostrarEnNosotros: boolean;
    }
  ) => {
    const user = userData ? { uid: userData.uid, email: userData.email } : null;
    await updatePhoto(id, data, user);
  };

  const handleDelete = async (id: string) => {
    const user = userData ? { uid: userData.uid, email: userData.email } : null;
    await deletePhoto(id, user);
  };

  const handleBatchSubmit = async (
    pendingItems: PendingFileItem[],
    onProgress: (c: number, t: number) => void
  ) => {
    if (!userData) return;
    await uploadBatch(pendingItems, { uid: userData.uid, email: userData.email }, onProgress);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white">Galería de Fotos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestiona, edita y asigna fotos al carrusel de "Nosotros" ({fotos.length} fotos)
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b8952d] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <Plus size={20} />
          Subir fotos
        </button>
      </div>

      {/* Filter Tabs */}
      <PhotoFilters activeFilter={filter} onSelectFilter={setFilter} counts={counts} />

      {/* Gallery Cards Grid */}
      <PhotoGrid
        fotos={filteredFotos}
        userRole={userData?.rol}
        onToggleVisibility={toggleVisibility}
        onToggleDestacada={toggleDestacada}
        onToggleNosotros={toggleNosotros}
        onEdit={(foto) => setEditingFoto(foto)}
        onDelete={handleDelete}
        onOpenUploadModal={() => setShowUploadModal(true)}
      />

      {/* Modal Subida Masiva */}
      <PhotoUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSubmitBatch={handleBatchSubmit}
      />

      {/* Modal Edición de Foto */}
      <PhotoEditModal
        foto={editingFoto}
        onClose={() => setEditingFoto(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
}
