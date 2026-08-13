import { useState, useEffect } from 'react';
import { usePhotos, type PhotoDisplayItem } from '../hooks/usePhotos';
import { Maximize2, X } from 'lucide-react';

const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'decoracion', label: 'Decoración' },
  { id: 'mobiliario', label: 'Mobiliario' },
  { id: 'banqueteria', label: 'Banquetería' },
];

const Galeria = () => {
  const { photos } = usePhotos();
  const [activeFilter, setActiveFilter] = useState('todos');
  const [modalItem, setModalItem] = useState<PhotoDisplayItem | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredPhotos = photos.filter(
    (item) => activeFilter === 'todos' || item.categoria === activeFilter
  );

  return (
    <section className="py-[100px] bg-[#fbfaf7] text-[#171717] relative" id="galeria">
      <div className="container-custom">
        
        {/* Section Header */}
        <div className="max-w-[720px] mx-auto mb-[45px] text-center">
          <div className="eyebrow-text">
            Galería de eventos
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold font-heading text-[#171717] mb-3">
            Momentos que ya hicimos realidad
          </h2>
          <div className="w-20 h-1 bg-[#d4af37] rounded-full mx-auto mb-4"></div>
          <p className="text-[#706c64] text-[0.98rem]">
            Explora una muestra de la ambientación, mobiliario y gastronomía de nuestras celebraciones.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex justify-center gap-2.5 flex-wrap mb-10">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`
                px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer transition-all duration-300 border
                ${
                  activeFilter === filter.id
                    ? 'bg-[#d4af37] border-[#d4af37] text-[#171717] shadow-[0_4px_15px_rgba(212,175,55,0.35)] scale-105'
                    : 'bg-white border-[#e7e2d8] text-[#555555] hover:bg-[#d4af37]/20 hover:border-[#d4af37]'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Responsive Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((item) => (
            <div
              key={item.id}
              onClick={() => setModalItem(item)}
              className={`
                group relative h-[280px] rounded-[22px] overflow-hidden cursor-pointer bg-[#171717] border border-[#e7e2d8] shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_40px_rgba(212,175,55,0.2)] hover:border-[#d4af37] transition-all duration-500
                ${item.wide ? 'sm:col-span-2 lg:col-span-2' : ''}
              `}
            >
              {/* Photo Image */}
              <img
                loading="lazy"
                src={item.thumb || item.url}
                alt={item.alt}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 block"
              />

              {/* Hover Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-6">
                
                {/* Top Right Zoom Icon */}
                <div className="self-end w-10 h-10 rounded-full bg-black/50 border border-white/20 backdrop-blur-md text-[#d4af37] flex items-center justify-center transform -translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <Maximize2 size={18} />
                </div>

                {/* Bottom Title & Category */}
                <div className="transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[#e2c34f] text-[0.72rem] font-bold uppercase tracking-widest block mb-1">
                    {item.categoriaLabel}
                  </span>
                  <h4 className="text-white text-lg font-bold font-heading leading-snug">
                    {item.titulo}
                  </h4>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {modalItem && (
        <div
          className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setModalItem(null)}
        >
          <div
            className="max-w-[1000px] w-full relative bg-[#141414] border border-white/10 rounded-[24px] p-3 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => setModalItem(null)}
              className="absolute right-4 top-4 z-10 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-[#d4af37] hover:text-[#171717] transition-all cursor-pointer"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>

            {/* Modal Photo */}
            <img
              src={modalItem.url}
              alt={modalItem.alt}
              className="w-full max-h-[78vh] object-contain rounded-[18px] block"
            />

            {/* Modal Footer Caption */}
            <div className="p-4 flex justify-between items-center bg-[#141414]">
              <div>
                <span className="text-[#d4af37] text-xs uppercase tracking-widest font-bold block mb-0.5">
                  {modalItem.categoriaLabel}
                </span>
                <h3 className="text-white text-base font-bold font-heading">
                  {modalItem.titulo}
                </h3>
              </div>
              <button
                onClick={() => setModalItem(null)}
                className="btn-gold !py-2 !px-4 text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Galeria;
