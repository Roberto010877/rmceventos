import { Sparkles, ShieldCheck, Award } from 'lucide-react';
import { useCompanyConfig } from '../hooks/useCompanyConfig';

const Hero = () => {
  const config = useCompanyConfig();

  const heroBg = config.heroImagenUrl || '/images/extracted/img_6.jpeg';

  return (
    <section 
      id="inicio" 
      className="relative min-h-[840px] flex items-center text-white bg-center bg-cover pt-[110px] pb-[140px] overflow-hidden transition-all duration-700"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.85), rgba(0,0,0,0.5)), url('${heroBg}')`
      }}
    >
      {/* Container with relative z-20 so all text and cards sit cleanly ABOVE the bottom gradient fade */}
      <div className="container-custom relative z-20">
        
        {/* Eyebrow tag */}
        <div className="eyebrow-text !text-[#d4af37] font-bold">
          Decoración · Mobiliario · Banquetería
        </div>
        
        {/* Title */}
        <h1 className="text-[clamp(2.8rem,6.5vw,5.5rem)] max-w-[800px] tracking-[-0.04em] font-bold font-heading leading-[1.12] text-white">
          Creamos momentos <span className="text-[#e1bd43]">inolvidables.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-[640px] text-[1.1rem] my-[24px] text-[#e5e5e5] font-normal leading-relaxed">
          {config.slogan || 'Decoración, mobiliario y banquetería para eventos únicos e irrepetibles. Diseñamos cada detalle para que tú solo tengas que disfrutar.'}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-4 flex-wrap mb-10">
          <a className="btn-gold !py-3.5 !px-7 font-bold text-sm shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_25px_rgba(212,175,55,0.6)]" href="#contacto">
            Cotiza tu evento →
          </a>
          <a className="btn-outline-hero !py-3.5 !px-7 font-bold text-sm" href="#servicios">
            Ver nuestros servicios
          </a>
        </div>

        {/* 3 Trust Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mt-8">
          
          <div className="px-4 py-3.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-[16px] flex items-center gap-3.5 shadow-lg hover:border-[#d4af37]/60 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Sparkles size={20} />
            </div>
            <div>
              <strong className="block text-white text-sm font-bold font-heading">Atención personalizada</strong>
              <span className="text-[#cccccc] text-xs font-medium">Escuchamos tu idea</span>
            </div>
          </div>

          <div className="px-4 py-3.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-[16px] flex items-center gap-3.5 shadow-lg hover:border-[#d4af37]/60 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} />
            </div>
            <div>
              <strong className="block text-white text-sm font-bold font-heading">Calidad garantizada</strong>
              <span className="text-[#cccccc] text-xs font-medium">Materiales y servicio</span>
            </div>
          </div>

          <div className="px-4 py-3.5 border border-white/20 bg-black/50 backdrop-blur-md rounded-[16px] flex items-center gap-3.5 shadow-lg hover:border-[#d4af37]/60 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#d4af37] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <Award size={20} />
            </div>
            <div>
              <strong className="block text-white text-sm font-bold font-heading">Experiencia</strong>
              <span className="text-[#cccccc] text-xs font-medium">Cuidamos cada detalle</span>
            </div>
          </div>

        </div>

      </div>

      {/* Smooth bottom transition fade into cream background */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[70px] z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, #fbfaf7 100%)' }}
      ></div>
    </section>
  );
};

export default Hero;
