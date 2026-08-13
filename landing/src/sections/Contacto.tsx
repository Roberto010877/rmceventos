import { useState, type FormEvent } from 'react';
import { useCompanyConfig } from '../hooks/useCompanyConfig';
import { enviarContacto } from '../services/contactoService';

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

const Contacto = () => {
  const config = useCompanyConfig();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipoEvento: 'Boda',
    mensaje: '',
    honeypot: '', // Campo trampa anti-spam
  });

  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [ultimoNombre, setUltimoNombre] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setErrorMessage('');

    try {
      await enviarContacto({
        nombre: formData.nombre,
        email: formData.email,
        telefono: formData.telefono,
        tipoEvento: formData.tipoEvento,
        mensaje: formData.mensaje,
        honeypot: formData.honeypot,
        source: 'landing',
      });

      setUltimoNombre(formData.nombre);
      setStatus('success');
      setFormData({
        nombre: '',
        email: '',
        telefono: '',
        tipoEvento: 'Boda',
        mensaje: '',
        honeypot: '',
      });
    } catch (err: any) {
      console.error('Error enviando contacto:', err);
      setStatus('error');
      setErrorMessage(err.message || 'No se pudo enviar el mensaje. Por favor intenta más tarde o escríbenos por WhatsApp.');
    }
  };

  const resetForm = () => {
    setStatus('idle');
    setErrorMessage('');
  };

  return (
    <section className="py-[100px] bg-white" id="contacto">
      <div className="container-custom grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-[50px]">
        {/* Left side copy & contact info */}
        <div>
          <div className="eyebrow-text">Contacto</div>
          <h2 className="text-3xl lg:text-4xl font-bold font-heading text-[#171717] leading-[1.2]">
            Cuéntanos cómo imaginas tu evento.
          </h2>
          <p className="text-[#706c64] my-[18px] mb-[28px]">
            Déjanos algunos datos y nos pondremos en contacto contigo para conversar sobre tu celebración y preparar una propuesta.
          </p>

          <div className="flex gap-[12px] my-[15px] items-center">
            <div className="w-[40px] h-[40px] rounded-[12px] bg-[#f7f5ef] grid place-items-center text-[#ad8b20] font-bold text-lg shrink-0">
              ✉
            </div>
            <div>
              <b className="font-semibold text-[0.84rem] font-heading text-[#171717] block">Escríbenos</b>
              <a href={`mailto:${config.email}`} className="block text-[#706c64] text-[0.87rem] hover:text-[#ad8b20] transition-colors">
                {config.email}
              </a>
            </div>
          </div>

          <div className="flex gap-[12px] my-[15px] items-center">
            <div className="w-[40px] h-[40px] rounded-[12px] bg-[#f7f5ef] grid place-items-center text-[#ad8b20] font-bold text-lg shrink-0">
              ☎
            </div>
            <div>
              <b className="font-semibold text-[0.84rem] font-heading text-[#171717] block">Llámanos</b>
              <a href={`tel:${config.telefono.replace(/\s+/g, '')}`} className="block text-[#706c64] text-[0.87rem] hover:text-[#ad8b20] transition-colors">
                {config.telefono}
              </a>
            </div>
          </div>

          <div className="flex gap-[12px] my-[15px] items-center">
            <div className="w-[40px] h-[40px] rounded-[12px] bg-[#f7f5ef] grid place-items-center text-[#ad8b20] font-bold text-lg shrink-0">
              ⌖
            </div>
            <div>
              <b className="font-semibold text-[0.84rem] font-heading text-[#171717] block">Ubicación</b>
              <span className="block text-[#706c64] text-[0.87rem]">{config.ubicacion}</span>
            </div>
          </div>

          {/* Social icons */}
          <div className="flex gap-2 mt-[24px]">
            <a href={config.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-[40px] h-[40px] border border-[#e7e2d8] rounded-full grid place-items-center font-bold text-[#171717] hover:bg-[#d4af37] transition-colors" aria-label="Facebook">
              f
            </a>
            <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-[40px] h-[40px] border border-[#e7e2d8] rounded-full grid place-items-center font-bold text-[#171717] hover:bg-[#d4af37] transition-colors" aria-label="Instagram">
              ◎
            </a>
            <a href={config.tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-[40px] h-[40px] border border-[#e7e2d8] rounded-full grid place-items-center font-bold text-[#171717] hover:bg-[#d4af37] transition-colors" aria-label="TikTok">
              ♪
            </a>
          </div>
        </div>

        {/* Right side form / Success state */}
        <div className="bg-[#fbfaf7] border border-[#e7e2d8] rounded-[22px] p-[28px] flex flex-col justify-center">
          {status === 'success' ? (
            <div className="py-6 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 grid place-items-center mx-auto text-3xl font-bold">
                ✓
              </div>
              <div>
                <h3 className="text-2xl font-bold font-heading text-[#171717] mb-2">
                  ¡Mensaje recibido!
                </h3>
                <p className="text-[#706c64] text-sm max-w-md mx-auto leading-relaxed">
                  Muchas gracias <strong>{ultimoNombre}</strong>. Hemos registrado tu solicitud y el equipo de <strong>RMC Eventos</strong> revisará tus datos para ponerse en contacto contigo a la brevedad.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center items-center">
                <a
                  href={config.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto bg-[#25d366] hover:bg-[#20bd5a] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
                >
                  <span>📲</span> Hablar por WhatsApp
                </a>
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full sm:w-auto border border-[#ddd7cb] hover:bg-white text-[#4d4941] font-semibold py-3 px-6 rounded-xl transition-colors text-sm"
                >
                  Enviar otra consulta
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {status === 'error' && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-start gap-3">
                  <span className="text-rose-600 text-lg leading-none shrink-0">✕</span>
                  <div>
                    <strong className="block font-bold mb-0.5">No pudimos completar el envío</strong>
                    <span>{errorMessage}</span>
                  </div>
                </div>
              )}

              {/* V2.1: Honeypot con accesibilidad corregida para lectores de pantalla y bots */}
              <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
                <label htmlFor="f-website">No llenar este campo si eres humano</label>
                <input
                  type="text"
                  id="f-website"
                  name="website"
                  value={formData.honeypot}
                  onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
                <div className="grid gap-[6px] mb-[13px]">
                  <label htmlFor="f-nombre" className="text-[0.77rem] font-bold text-[#4d4941]">Nombre</label>
                  <input
                    id="f-nombre"
                    name="nombre"
                    required
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full border border-[#ddd7cb] bg-white rounded-[11px] p-[12px_13px] outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid gap-[6px] mb-[13px]">
                  <label htmlFor="f-email" className="text-[0.77rem] font-bold text-[#4d4941]">Correo electrónico</label>
                  <input
                    id="f-email"
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-[#ddd7cb] bg-white rounded-[11px] p-[12px_13px] outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid gap-[6px] mb-[13px]">
                  <label htmlFor="f-tel" className="text-[0.77rem] font-bold text-[#4d4941]">Teléfono / WhatsApp</label>
                  <input
                    id="f-tel"
                    name="telefono"
                    required
                    placeholder="+591 ..."
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full border border-[#ddd7cb] bg-white rounded-[11px] p-[12px_13px] outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid gap-[6px] mb-[13px]">
                  <label htmlFor="f-tipo" className="text-[0.77rem] font-bold text-[#4d4941]">Tipo de evento</label>
                  <select
                    id="f-tipo"
                    name="tipoEvento"
                    value={formData.tipoEvento}
                    onChange={(e) => setFormData({ ...formData, tipoEvento: e.target.value })}
                    className="w-full border border-[#ddd7cb] bg-white rounded-[11px] p-[12px_13px] outline-none focus:border-[#d4af37]"
                  >
                    <option>Boda</option>
                    <option>Cumpleaños</option>
                    <option>Aniversario</option>
                    <option>Evento empresarial</option>
                    <option>Otro</option>
                  </select>
                </div>

                <div className="grid gap-[6px] mb-[13px] sm:col-span-2">
                  <label htmlFor="f-msg" className="text-[0.77rem] font-bold text-[#4d4941]">Cuéntanos sobre tu evento</label>
                  <textarea
                    id="f-msg"
                    name="mensaje"
                    required
                    placeholder="Fecha aproximada, cantidad de invitados, servicios que necesitas..."
                    value={formData.mensaje}
                    onChange={(e) => setFormData({ ...formData, mensaje: e.target.value })}
                    className="w-full border border-[#ddd7cb] bg-white rounded-[11px] p-[12px_13px] outline-none focus:border-[#d4af37] min-h-[125px] resize-y"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="btn-gold font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando mensaje...
                  </>
                ) : (
                  'Enviar mensaje →'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Contacto;
