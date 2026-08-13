import { Sparkles, Armchair, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { useServices } from '../hooks/useServices';

const serviceIcons = [
  <Sparkles className="w-5 h-5 text-[#d4af37]" key="1" />,
  <Armchair className="w-5 h-5 text-[#d4af37]" key="2" />,
  <UtensilsCrossed className="w-5 h-5 text-[#d4af37]" key="3" />,
];

const Servicios = () => {
  const { services } = useServices();

  return (
    <section className="py-[100px] bg-white" id="servicios">
      <div className="container-custom">
        <div className="eyebrow-text">Nuestros Servicios</div>
        <h2 className="text-3xl lg:text-4xl font-bold font-heading text-[#171717] max-w-[620px] leading-[1.2]">
          Soluciones integrales para que tu evento sea perfecto.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 mt-12">
          {services.map((service, index) => {
            const icon = serviceIcons[index % serviceIcons.length];

            return (
              <div 
                key={service.id} 
                className="group bg-white border border-[#e7e2d8] rounded-[24px] overflow-hidden shadow-xs hover:shadow-[0_16px_40px_rgba(0,0,0,0.08)] hover:border-[#d4af37]/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Dynamic Image Container */}
                  <div className="relative h-[220px] overflow-hidden bg-gray-100">
                    <img 
                      src={service.imagenUrl} 
                      alt={service.alt}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md w-10 h-10 rounded-full flex items-center justify-center shadow-md">
                      {icon}
                    </div>
                  </div>

                  {/* Text Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold font-heading text-[#171717] group-hover:text-[#d4af37] transition-colors">
                      {service.nombre}
                    </h3>
                    <p className="text-[#706c64] text-sm mt-2.5 leading-relaxed">
                      {service.descripcion}
                    </p>
                  </div>
                </div>

                {/* Card Action */}
                <div className="px-6 pb-6 pt-2">
                  <a 
                    href="#contacto"
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#171717] hover:text-[#d4af37] transition-colors group/link"
                  >
                    <span>Cotizar este servicio</span>
                    <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Servicios;
