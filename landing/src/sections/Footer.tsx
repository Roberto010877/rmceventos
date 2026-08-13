import { useState, useEffect } from 'react';
import { Globe, Share2, Music, Phone, Mail, MapPin, ArrowUp } from 'lucide-react';
import { useCompanyConfig } from '../hooks/useCompanyConfig';

const Footer = () => {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const config = useCompanyConfig();

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <footer className="bg-[#0b0b0b] text-[#cccccc] pt-16 pb-8 border-t border-[#d4af37]/20 relative overflow-hidden">
        {/* Subtle gold glow in background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent opacity-60"></div>
        
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
            
            {/* Column 1: Brand & Logo */}
            <div className="space-y-4">
              <a href="#inicio" className="inline-block mb-2">
                <img 
                  src="/images/extracted/img_26.png" 
                  alt="RMC EVENTOS" 
                  className="h-10 w-auto block filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.2)]"
                />
              </a>
              <p className="text-[#999999] text-sm leading-relaxed max-w-sm">
                {config.descripcion}
              </p>
              
              {/* Social links */}
              <div className="flex items-center gap-3 pt-2">
                <a 
                  href={config.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37] hover:text-[#171717] transition-all"
                  aria-label="Facebook"
                >
                  <Share2 size={18} />
                </a>
                <a 
                  href={config.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37] hover:text-[#171717] transition-all"
                  aria-label="Instagram"
                >
                  <Globe size={18} />
                </a>
                <a 
                  href={config.tiktokUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#181818] border border-white/10 flex items-center justify-center text-[#d4af37] hover:bg-[#d4af37] hover:text-[#171717] transition-all"
                  aria-label="TikTok"
                >
                  <Music size={18} />
                </a>
              </div>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h4 className="text-white font-bold font-heading uppercase text-xs tracking-wider mb-5 border-l-2 border-[#d4af37] pl-3">
                Navegación
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#inicio" className="text-[#999999] hover:text-[#d4af37] transition-colors">Inicio</a></li>
                <li><a href="#nosotros" className="text-[#999999] hover:text-[#d4af37] transition-colors">Sobre Nosotros</a></li>
                <li><a href="#servicios" className="text-[#999999] hover:text-[#d4af37] transition-colors">Nuestros Servicios</a></li>
                <li><a href="#galeria" className="text-[#999999] hover:text-[#d4af37] transition-colors">Galería de Eventos</a></li>
                <li><a href="#testimonios" className="text-[#999999] hover:text-[#d4af37] transition-colors">Testimonios</a></li>
                <li><a href="#contacto" className="text-[#999999] hover:text-[#d4af37] transition-colors">Cotizaciones</a></li>
              </ul>
            </div>

            {/* Column 3: Contact Info (Loaded from Firebase Firestore) */}
            <div>
              <h4 className="text-white font-bold font-heading uppercase text-xs tracking-wider mb-5 border-l-2 border-[#d4af37] pl-3">
                Contacto Directo
              </h4>
              <ul className="space-y-3.5 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-[#d4af37] shrink-0 mt-0.5" />
                  <span className="text-[#999999]">{config.ubicacion}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-[#d4af37] shrink-0" />
                  <a href={`tel:${config.telefono.replace(/\s+/g, '')}`} className="text-[#999999] hover:text-white transition-colors">
                    {config.telefono}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-[#d4af37] shrink-0" />
                  <a href={`mailto:${config.email}`} className="text-[#999999] hover:text-white transition-colors">
                    {config.email}
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Business Hours & Info */}
            <div>
              <h4 className="text-white font-bold font-heading uppercase text-xs tracking-wider mb-5 border-l-2 border-[#d4af37] pl-3">
                Horario de Atención
              </h4>
              <p className="text-xs text-[#999999] leading-relaxed mb-4">
                Atención personalizada para citas y consultas de proyectos.
              </p>
              <div className="bg-[#141414] p-3.5 rounded-xl border border-white/5 text-xs space-y-1.5">
                <div className="flex justify-between text-[#cccccc]">
                  <span>Lunes a Viernes:</span>
                  <span className="text-[#d4af37] font-medium">08:30 - 18:30</span>
                </div>
                <div className="flex justify-between text-[#cccccc]">
                  <span>Sábados:</span>
                  <span className="text-[#d4af37] font-medium">09:00 - 14:00</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#888888]">
            <p>© {new Date().getFullYear()} RMC EVENTOS. Todos los derechos reservados.</p>
            <p className="flex items-center gap-1">
              Hecho con <span className="text-red-500">❤️</span> en Santa Cruz, Bolivia
            </p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href={config.whatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        className="fixed right-5 bottom-5 w-14 h-14 rounded-full bg-[#25d366] text-white grid place-items-center z-50 shadow-[0_10px_25px_rgba(37,211,102,0.4)] hover:scale-110 transition-all duration-300 group"
      >
        <svg viewBox="0 0 32 32" fill="currentColor" className="w-7 h-7">
          <path d="M16 3C9.4 3 4 8.4 4 15c0 2.4.7 4.6 1.9 6.5L4 29l7.7-1.9C13.5 27.7 14.7 28 16 28c6.6 0 12-5.4 12-12S22.6 3 16 3zm0 22c-1.2 0-2.4-.3-3.5-.9l-.3-.2-4.5 1.1 1.2-4.4-.2-.3C7.6 18.8 7 17 7 15c0-5 4-9 9-9s9 4 9 9-4 9-9 9zm5-6.8c-.3-.1-1.6-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.5.1-.3-.1-1.2-.4-2.2-1.4-.8-.7-1.4-1.6-1.5-1.9-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.1.2-.3.2-.5.1-.2 0-.4 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.3-1 1-1 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3.1 4.9 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.6-.7 1.9-1.3.2-.6.2-1.1.2-1.3-.1-.1-.3-.2-.5-.3z"/>
        </svg>
      </a>

      {/* Scroll to Top Button */}
      <button 
        onClick={scrollToTop}
        aria-label="Volver arriba"
        className={`
          fixed right-5 bottom-22 w-10 h-10 border border-white/20 rounded-full bg-[#181818] text-[#d4af37] flex items-center justify-center z-50 transition-all duration-300 shadow-lg hover:bg-[#d4af37] hover:text-[#171717]
          ${showTopBtn ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
      >
        <ArrowUp size={18} />
      </button>
    </>
  );
};

export default Footer;
