import { useState, useRef } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTestimonios } from '../hooks/useTestimonios';

const Testimonios = () => {
  const { testimonios } = useTestimonios();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <section className="py-[100px] bg-[#f7f5ef] text-[#171717] relative overflow-hidden" id="testimonios">
      <div className="container-custom relative z-10">
        
        {/* Section Header */}
        <div className="max-w-[720px] mx-auto mb-[45px] text-center">
          <div className="eyebrow-text">
            Testimonios
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold font-heading text-[#171717] mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <div className="w-20 h-1 bg-[#d4af37] rounded-full mx-auto mb-4"></div>
          <p className="text-[#706c64] text-[0.98rem]">
            Historias y experiencias reales de quienes confiaron en RMC EVENTOS para sus celebraciones.
          </p>
        </div>

        {/* Carousel Container with Arrows */}
        <div className="relative group">
          
          {/* Left Arrow Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-[#e7e2d8] text-[#171717] shadow-lg flex items-center justify-center hover:bg-[#d4af37] hover:border-[#d4af37] transition-all cursor-pointer"
              aria-label="Anterior"
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Right Arrow Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-[#e7e2d8] text-[#171717] shadow-lg flex items-center justify-center hover:bg-[#d4af37] hover:border-[#d4af37] transition-all cursor-pointer"
              aria-label="Siguiente"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Horizontal Scrollable Track */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-6 overflow-x-auto pb-6 pt-2 scroll-smooth hide-scrollbar px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {testimonios.map((t) => (
              <article
                key={t.id}
                className="w-[320px] sm:w-[360px] md:w-[380px] shrink-0 bg-white border border-[#e7e2d8] rounded-[22px] p-7 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_35px_rgba(212,175,55,0.15)] hover:border-[#d4af37]/60 transition-all duration-300 group"
              >
                <div>
                  {/* Stars & Quote Icon */}
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex gap-1">
                      {Array.from({ length: t.calificacion || 5 }).map((_, i) => (
                        <Star key={i} size={16} className="fill-[#d4af37] text-[#d4af37]" />
                      ))}
                    </div>
                    <Quote size={32} className="text-[#d4af37]/30 group-hover:text-[#d4af37] transition-colors" />
                  </div>

                  {/* Testimonial Quote */}
                  <p className="text-[#555555] text-[0.96rem] italic leading-relaxed mb-6">
                    "{t.mensaje}"
                  </p>
                </div>

                {/* Client Footer */}
                <div className="flex items-center gap-3.5 pt-4 border-t border-[#f0ebe1] mt-auto">
                  <div className="w-10 h-10 rounded-full bg-[#191919] text-[#e1bf45] font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                    {getInitials(t.nombreCliente)}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#171717] text-[0.88rem] font-heading group-hover:text-[#ad8b20] transition-colors">
                      {t.nombreCliente}
                    </h4>
                    {t.tipoEvento && (
                      <span className="text-[#ad8b20] text-[0.78rem] font-semibold block">
                        {t.tipoEvento}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Note Footer */}
        <div className="text-center mt-6">
          <span className="text-[0.8rem] text-[#888888] italic">
            * En producción, esta sección se alimenta dinámicamente con testimonios aprobados desde el panel administrativo.
          </span>
        </div>

      </div>
    </section>
  );
};

export default Testimonios;
