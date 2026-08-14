import { useState, useRef, type FormEvent } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight, MessageSquarePlus, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useTestimonios } from '../hooks/useTestimonios';
import { enviarTestimonio } from '../services/testimonioService';

const Testimonios = () => {
  const { testimonios } = useTestimonios();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Modal estado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [formData, setFormData] = useState({
    nombreCliente: '',
    tipoEvento: 'Boda',
    mensaje: '',
  });

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

  const handleSubmitTestimonio = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    try {
      await enviarTestimonio({
        nombreCliente: formData.nombreCliente,
        tipoEvento: formData.tipoEvento,
        mensaje: formData.mensaje,
        calificacion: rating,
      });

      setSubmitted(true);
      setFormData({ nombreCliente: '', tipoEvento: 'Boda', mensaje: '' });
      setRating(5);
    } catch (err: any) {
      console.error('Error al enviar testimonio:', err);
      setErrorMessage(err?.message || 'Ocurrió un error al enviar tu testimonio. Por favor inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSubmitted(false);
    setErrorMessage('');
  };

  return (
    <section className="py-[100px] bg-[#f7f5ef] text-[#171717] relative overflow-hidden" id="testimonios">
      <div className="container-custom relative z-10">
        
        {/* Section Header */}
        <div className="max-w-[720px] mx-auto mb-[35px] text-center">
          <div className="eyebrow-text">
            Testimonios
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold font-heading text-[#171717] mb-3">
            Lo que dicen nuestros clientes
          </h2>
          <div className="w-20 h-1 bg-[#d4af37] rounded-full mx-auto mb-4"></div>
          <p className="text-[#706c64] text-[0.98rem] mb-6">
            Historias y experiencias reales de quienes confiaron en RMC EVENTOS para sus celebraciones.
          </p>

          {/* Botón para Dejar Testimonio */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-[#171717] hover:bg-[#2b2b2b] text-[#d4af37] border border-[#d4af37]/40 px-5 py-2.5 rounded-full font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <MessageSquarePlus size={16} />
            <span>✍️ Dejar mi testimonio</span>
          </button>
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

      </div>

      {/* Modal para escribir testimonio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#e7e2d8] rounded-[24px] max-w-md w-full p-6 sm:p-8 relative shadow-2xl">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-[#706c64] hover:text-[#171717] p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>

            {submitted ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto text-2xl">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-xl font-bold font-heading text-[#171717]">
                  ¡Muchas gracias por tu testimonio!
                </h3>
                <p className="text-[#706c64] text-sm leading-relaxed">
                  Tu opinión ha sido enviada al equipo de <strong>RMC Eventos</strong>. Será publicada en el sitio web en breve tras ser aprobada por el administrador.
                </p>
                <button
                  onClick={closeModal}
                  className="btn-gold font-bold w-full mt-4"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitTestimonio} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold font-heading text-[#171717]">
                    Escribir un Testimonio
                  </h3>
                  <p className="text-xs text-[#706c64] mt-1">
                    Comparte tu experiencia celebrando tu evento con RMC EVENTOS
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#4d4941] mb-1">Tu Nombre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: María Fernanda L."
                    value={formData.nombreCliente}
                    onChange={(e) => setFormData({ ...formData, nombreCliente: e.target.value })}
                    className="w-full border border-[#ddd7cb] rounded-xl p-2.5 text-sm outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4d4941] mb-1">Tipo de Evento</label>
                  <select
                    value={formData.tipoEvento}
                    onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                    className="w-full border border-[#ddd7cb] rounded-xl p-2.5 text-sm outline-none focus:border-[#d4af37]"
                  >
                    <option>Boda</option>
                    <option>Cumpleaños</option>
                    <option>Quinceañero</option>
                    <option>Aniversario</option>
                    <option>Evento Corporativo</option>
                    <option>Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4d4941] mb-1">Calificación</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          size={24}
                          className={star <= rating ? 'fill-[#d4af37] text-[#d4af37]' : 'text-gray-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4d4941] mb-1">Tu Experiencia / Opinión</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Cuéntanos cómo fue el servicio, la decoración o la atención..."
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    className="w-full border border-[#ddd7cb] rounded-xl p-2.5 text-sm outline-none focus:border-[#d4af37] resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-gold font-bold w-full flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-black" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar testimonio'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Testimonios;
