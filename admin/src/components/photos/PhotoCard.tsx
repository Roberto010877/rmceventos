import { Eye, EyeOff, LayoutGrid, Star, Edit3, Trash2 } from 'lucide-react';
import type { Foto } from '../../types/photo';

interface PhotoCardProps {
  foto: Foto;
  userRole?: string;
  onToggleVisibility: (foto: Foto) => void;
  onToggleDestacada: (foto: Foto) => void;
  onToggleNosotros: (foto: Foto) => void;
  onEdit: (foto: Foto) => void;
  onDelete: (id: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  foto,
  userRole,
  onToggleVisibility,
  onToggleDestacada,
  onToggleNosotros,
  onEdit,
  onDelete,
}) => {
  const canDelete = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border ${
        foto.visible === false
          ? 'border-amber-300 dark:border-amber-800 opacity-75'
          : 'border-gray-200 dark:border-gray-700'
      } shadow-sm overflow-hidden group hover:shadow-md transition-all flex flex-col justify-between`}
    >
      {/* Photo Image & Top Badges */}
      <div>
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden">
          <img
            src={foto.url}
            alt={foto.descripcion || 'Foto RMC Eventos'}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Top Badges Left */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <button
              onClick={() => onToggleVisibility(foto)}
              className={`px-2.5 py-1 text-[0.7rem] rounded-full font-semibold shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer ${
                foto.visible !== false
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
              title={foto.visible !== false ? 'Pública en landing' : 'Oculta de la landing'}
            >
              {foto.visible !== false ? <Eye size={11} /> : <EyeOff size={11} />}
              {foto.visible !== false ? 'Pública' : 'Oculta'}
            </button>

            {/* Badge / Button "En Nosotros" */}
            <button
              onClick={() => onToggleNosotros(foto)}
              className={`px-2.5 py-1 text-[0.65rem] rounded-full font-bold shadow-md flex items-center gap-1 transition-transform active:scale-95 cursor-pointer ${
                foto.mostrarEnNosotros
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-black/50 text-white/80 hover:bg-purple-600 hover:text-white backdrop-blur-md'
              }`}
              title={
                foto.mostrarEnNosotros
                  ? 'Se muestra en el carrusel de Nosotros. Haz clic para quitar.'
                  : 'Agregar al carrusel de Nosotros.'
              }
            >
              <LayoutGrid size={10} />
              {foto.mostrarEnNosotros ? 'En Nosotros' : '+ Nosotros'}
            </button>
          </div>

          {/* Top Badges Right */}
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={() => onToggleDestacada(foto)}
              className={`p-1.5 rounded-full shadow transition-all cursor-pointer ${
                foto.destacada
                  ? 'bg-[#D4AF37] text-white'
                  : 'bg-black/40 text-white/70 hover:text-white backdrop-blur-md'
              }`}
              title={foto.destacada ? 'Destacada' : 'Marcar destacada'}
            >
              <Star size={14} className={foto.destacada ? 'fill-white' : ''} />
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D4AF37]">
              {foto.categoria}
            </span>
          </div>

          {foto.descripcion ? (
            <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
              {foto.descripcion}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic">Sin descripción</p>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center text-xs">
        <button
          onClick={() => onEdit(foto)}
          className="flex items-center gap-1 text-[#D4AF37] hover:text-[#b8952d] font-bold py-1 px-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors cursor-pointer"
        >
          <Edit3 size={14} />
          Editar
        </button>

        {canDelete && (
          <button
            onClick={() => onDelete(foto.id)}
            className="text-gray-400 hover:text-red-500 p-1.5 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            title="Eliminar foto"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
