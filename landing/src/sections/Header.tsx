import { useState, useEffect } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Nosotros', href: '#nosotros' },
    { name: 'Servicios', href: '#servicios' },
    { name: 'Galería', href: '#galeria' },
    { name: 'Testimonios', href: '#testimonios' },
    { name: 'Contacto', href: '#contacto' },
  ];

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[#121212d9] backdrop-blur-[15px] border-b border-white/10">
      <div className="container-custom h-[78px] flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#inicio" className="flex items-center">
          <img 
            src="/images/extracted/img_7.png" 
            alt="RMC EVENTOS" 
            className="h-[52px] w-auto block"
          />
        </a>

        {/* Navigation & Menu */}
        <nav className="relative">
          <button 
            className="menu md:hidden bg-none border-0 text-white text-2xl cursor-pointer p-2" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <ul 
            className={`
              flex gap-7 list-none text-[#eee] text-[0.86rem]
              max-[900px]:hidden max-[900px]:absolute max-[900px]:top-[50px] max-[900px]:left-[-100px] max-[900px]:right-[-20px] 
              max-[900px]:bg-[#181818] max-[900px]:border max-[900px]:border-[#333] max-[900px]:rounded-[15px] max-[900px]:p-3 
              max-[900px]:flex-col max-[900px]:gap-0
              ${isMenuOpen ? 'max-[900px]:!flex' : ''}
            `}
          >
            {navLinks.map((link) => (
              <li key={link.name}>
                <a 
                  href={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="hover:text-[#d4af37] transition-colors max-[900px]:block max-[900px]:py-2.5 max-[900px]:px-2"
                >
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* CTA Button */}
        <a 
          href="#contacto" 
          className="navcta hidden sm:inline-flex px-[18px] py-[11px] rounded-full bg-[#d4af37] text-[#171717] font-bold text-[0.78rem] hover:bg-[#e2c04a] transition-all"
        >
          Cotiza tu evento
        </a>
      </div>
    </header>
  );
};

export default Header;
