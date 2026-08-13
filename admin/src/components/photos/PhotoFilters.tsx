import type { FilterCategory, PhotoCounts } from '../../types/photo';

interface PhotoFiltersProps {
  activeFilter: FilterCategory;
  onSelectFilter: (filter: FilterCategory) => void;
  counts: PhotoCounts;
}

export const PhotoFilters: React.FC<PhotoFiltersProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const tabs: { id: FilterCategory; label: string }[] = [
    { id: 'todas', label: `Todas (${counts.todas})` },
    { id: 'decoracion', label: `Decoración (${counts.decoracion})` },
    { id: 'mobiliario', label: `Mobiliario (${counts.mobiliario})` },
    { id: 'banqueteria', label: `Banquetería (${counts.banqueteria})` },
    { id: 'nosotros', label: `🖼️ En Nosotros (${counts.nosotros})` },
    { id: 'destacadas', label: `★ Destacadas (${counts.destacadas})` },
    { id: 'ocultas', label: `🙈 Ocultas (${counts.ocultas})` },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectFilter(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
            activeFilter === cat.id
              ? 'bg-[#D4AF37] text-white shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
};
