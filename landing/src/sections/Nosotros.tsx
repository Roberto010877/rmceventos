import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePhotos } from '../hooks/usePhotos';

const fallbackImages = [
  { url: '/images/extracted/img_8.jpeg', alt: 'Mesa de evento decorada con velas y flores' },
  { url: '/images/extracted/img_12.jpeg', alt: 'Salón de eventos con arreglos florales altos' },
  { url: '/images/extracted/img_22.jpeg', alt: 'Centro de mesa floral en tonos borgoña' },
  { url: '/images/extracted/img_24.jpeg', alt: 'Mesa cálida con velas' },
];

const Nosotros = () => {
  const { nosotrosPhotos } = usePhotos();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Lista de fotos a mostrar (de Firestore o fallback)
  const carouselImages = nosotrosPhotos.length > 0
    ? nosotrosPhotos.map(p => ({ url: p.url || p.thumb, alt: p.alt || p.titulo }))
    : fallbackImages;

  // Auto-play carrusel cada 4 segundos (4000ms)
  useEffect(() => {
    if (carouselImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? carouselImages.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % carouselImages.length);
  };

  return (
    <section className="py-[100px] bg-[#fbfaf7]" id="nosotros">
      <div className="container-custom grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-[70px] items-center">
        
        {/* Left Side Copy & Points */}
        <div>
          <div className="eyebrow-text">Nosotros</div>
          <h2 className="text-3xl lg:text-4xl font-bold font-heading text-[#171717] leading-[1.2]">
            Tu evento merece sentirse tan especial como lo imaginaste.
          </h2>
          <p className="text-[#706c64] text-[1.03rem] mt-[18px]">
            En RMC EVENTOS integramos decoración, alquiler de mobiliario y menaje, y banquetería para crear una experiencia coherente de principio a fin.
          </p>
          <p className="text-[#706c64] text-[1.03rem] mt-4">
            Trabajamos cada celebración de manera personalizada, cuidando la ambientación, la presentación y esos pequeños detalles que hacen la diferencia.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px] mt-[28px]">
            <div className="bg-white border border-[#e7e2d8] rounded-[16px] p-[17px] shadow-xs">
              <b className="font-semibold text-[0.88rem] font-heading block text-[#171717]">Diseño a tu medida</b>
              <small className="block text-[#706c64] mt-[4px] text-[0.8rem]">Adaptamos la propuesta a tu estilo.</small>
            </div>
            <div className="bg-white border border-[#e7e2d8] rounded-[16px] p-[17px] shadow-xs">
              <b className="font-semibold text-[0.88rem] font-heading block text-[#171717]">Todo en un solo lugar</b>
              <small className="block text-[#706c64] mt-[4px] text-[0.8rem]">Menos proveedores, más tranquilidad.</small>
            </div>
            <div className="bg-white border border-[#e7e2d8] rounded-[16px] p-[17px] shadow-xs">
              <b className="font-semibold text-[0.88rem] font-heading block text-[#171717]">Montaje profesional</b>
              <small className="block text-[#706c64] mt-[4px] text-[0.8rem]">Nos ocupamos de que todo luzca perfecto.</small>
            </div>
            <div className="bg-white border border-[#e7e2d8] rounded-[16px] p-[17px] shadow-xs">
              <b className="font-semibold text-[0.88rem] font-heading block text-[#171717]">Servicio cercano</b>
              <small className="block text-[#706c64] mt-[4px] text-[0.8rem]">Te acompañamos durante el proceso.</small>
            </div>
          </div>
        </div>

        {/* Right Side - Dynamic Interactive Carousel */}
        <div className="relative group overflow-hidden rounded-[26px] shadow-[0_18px_50px_rgba(25,22,15,0.12)] h-[450px] lg:h-[550px] bg-[#171717]">
          
          {/* Images Stack with Smooth Crossfade Transition */}
          {carouselImages.map((img, idx) => (
            <img
              key={idx}
              loading="lazy"
              src={img.url}
              alt={img.alt}
              className={`
                absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out block
                ${idx === currentIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'}
              `}
            />
          ))}

          {/* Dark Overlay gradient for contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-15 pointer-events-none"></div>

          {/* Navigation Arrow Left */}
          {carouselImages.length > 1 && (
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#d4af37] hover:text-[#171717] hover:border-[#d4af37] transition-all cursor-pointer shadow-lg"
              aria-label="Anterior foto"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Navigation Arrow Right */}
          {carouselImages.length > 1 && (
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 border border-white/20 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#d4af37] hover:text-[#171717] hover:border-[#d4af37] transition-all cursor-pointer shadow-lg"
              aria-label="Siguiente foto"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Carousel Dot Indicators */}
          {carouselImages.length > 1 && (
            <div className="absolute top-5 right-5 z-30 flex gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              {carouselImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`
                    h-2 rounded-full transition-all duration-300 cursor-pointer
                    ${idx === currentIndex ? 'w-6 bg-[#d4af37]' : 'w-2 bg-white/60 hover:bg-white'}
                  `}
                  aria-label={`Ir a foto ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Floating Brand Badge */}
          <div className="absolute left-5 bottom-5 z-30 bg-white/95 backdrop-blur-md rounded-[18px] p-[15px_20px] shadow-[0_12px_35px_rgba(0,0,0,0.25)] border border-white/40">
            <b className="font-heading font-bold text-[#171717] text-[1.05rem] block">RMC EVENTOS</b>
            <small className="block text-[#706c64] text-[0.8rem] font-medium mt-0.5">Hacemos realidad tus ideas.</small>
          </div>

        </div>

      </div>
    </section>
  );
};

export default Nosotros;
