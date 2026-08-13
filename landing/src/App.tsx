import Header from './sections/Header';
import Hero from './sections/Hero';
import Nosotros from './sections/Nosotros';
import Servicios from './sections/Servicios';
import Galeria from './sections/Galeria';
import Testimonios from './sections/Testimonios';
import Contacto from './sections/Contacto';
import Footer from './sections/Footer';

function App() {
  return (
    <div className="min-h-screen bg-[#fbfaf7] text-[#171717]">
      <Header />
      <main>
        <Hero />
        <Nosotros />
        <Servicios />
        <Galeria />
        <Testimonios />
        <Contacto />
      </main>
      <Footer />
    </div>
  );
}

export default App;
