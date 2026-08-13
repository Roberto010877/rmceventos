import { ImageIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardPhoto } from '../../types/dashboard';

interface PhotoOverviewProps {
  photos: DashboardPhoto[];
}

export default function PhotoOverview({ photos }: PhotoOverviewProps) {
  return (
    <section className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-poppins text-lg font-bold text-[var(--text-primary)]">Fotos recientes</h2>
        <Link to="/fotos" className="text-sm font-semibold text-dorado hover:underline">
          Gestionar
        </Link>
      </div>

      {photos.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-secondary)]">
          <ImageIcon size={18} />
          No hay fotos cargadas.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {photos.map((photo) => (
            <Link
              key={photo.id}
              to="/fotos"
              className="relative aspect-square overflow-hidden rounded-lg bg-black/10"
              title={photo.descripcion || photo.categoria}
            >
              {photo.url ? (
                <img src={photo.url} alt={photo.descripcion || 'Foto RMC Eventos'} className="h-full w-full object-cover transition-transform hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--text-secondary)]">
                  <ImageIcon size={20} />
                </div>
              )}
              {!photo.visible && (
                <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  Oculta
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
