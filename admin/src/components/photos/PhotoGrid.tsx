import { Image as ImageIcon } from 'lucide-react';
import type { Foto } from '../../types/photo';
import { PhotoCard } from './PhotoCard';

interface PhotoGridProps {
  fotos: Foto[];
  userRole?: string;
  onToggleVisibility: (foto: Foto) => void;
  onToggleDestacada: (foto: Foto) => void;
  onToggleNosotros: (foto: Foto) => void;
  onEdit: (foto: Foto) => void;
  onDelete: (id: string) => void;
  onOpenUploadModal: () => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
  fotos,
  userRole,
  onToggleVisibility,
  onToggleDestacada,
  onToggleNosotros,
  onEdit,
  onDelete,
  onOpenUploadModal,
}) => {
  if (fotos.length === 0) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        <ImageIcon className="mx-auto text-gray-400 mb-3" size={48} />
        <p className="text-gray-500 dark:text-gray-400 font-medium">No hay fotos en esta categoría</p>
        <button
          onClick={onOpenUploadModal}
          className="mt-4 text-sm text-[#D4AF37] font-semibold hover:underline cursor-pointer"
        >
          + Subir fotos
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {fotos.map((foto) => (
        <PhotoCard
          key={foto.id}
          foto={foto}
          userRole={userRole}
          onToggleVisibility={onToggleVisibility}
          onToggleDestacada={onToggleDestacada}
          onToggleNosotros={onToggleNosotros}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
