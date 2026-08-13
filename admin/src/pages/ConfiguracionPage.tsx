import { useEffect, useState, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Save, Phone, Mail, MapPin, Globe, MessageCircle, Loader2, CheckCircle, Image as ImageIcon, UploadCloud, RotateCcw, HelpCircle } from 'lucide-react';

interface SiteConfig {
  nombreNegocio: string;
  slogan: string;
  whatsappNumero: string;
  telefonoMostrar: string;
  correoContacto: string;
  ciudad: string;
  direccion: string;
  instagramUrl: string;
  facebookUrl: string;
  tiktokUrl: string;
  horarioAtencion: string;
  heroImagenUrl: string;
}

const defaultConfig: SiteConfig = {
  nombreNegocio: 'RMC EVENTOS',
  slogan: 'Hacemos de tu evento algo inolvidable',
  whatsappNumero: '',
  telefonoMostrar: '',
  correoContacto: '',
  ciudad: 'Santa Cruz, Bolivia',
  direccion: '',
  instagramUrl: '',
  facebookUrl: '',
  tiktokUrl: '',
  horarioAtencion: 'Lunes a Sábado: 9:00 - 18:00',
  heroImagenUrl: '/images/extracted/img_6.jpeg',
};

/**
 * Comprime imágenes de fondo grandes antes de guardar en Firestore
 */
const MAX_HERO_IMAGE_BYTES = 200 * 1024;

const compressImage = (file: File, maxWidth = 1280, maxHeight = 720): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      const fallbackReader = new FileReader();
      fallbackReader.onloadend = () => resolve(fallbackReader.result as string);
      fallbackReader.readAsDataURL(file);
    };
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(img.src);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const qualities = [0.76, 0.68, 0.6, 0.52, 0.44, 0.36, 0.3];
      for (const quality of qualities) {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        if (getDataUrlByteSize(compressedDataUrl) <= MAX_HERO_IMAGE_BYTES) {
          resolve(compressedDataUrl);
          return;
        }
      }

      resolve(canvas.toDataURL('image/jpeg', 0.26));
    };
    reader.readAsDataURL(file);
  });
};

const ConfiguracionPage = () => {
  const { userData } = useAuth();
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  const heroFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const { heroImagenPath: _legacyHeroImagenPath, ...loadedConfig } = docSnap.data();
          setConfig({ ...defaultConfig, ...loadedConfig } as SiteConfig);
        }
      } catch (err) {
        console.error('Error al cargar configuración:', err);
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleChange = (field: keyof SiteConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleHeroFileSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido.');
      return;
    }
    setUploadingHero(true);
    try {
      const compressedDataUrl = await compressImage(file);
      if (getDataUrlByteSize(compressedDataUrl) > MAX_HERO_IMAGE_BYTES) {
        alert('La imagen sigue superando 200 KB despues de comprimirla. Usa una imagen mas liviana o una URL externa.');
        return;
      }

      setConfig(prev => ({
        ...prev,
        heroImagenUrl: compressedDataUrl,
      }));
      setSaved(false);
    } catch (err) {
      console.error('Error al procesar imagen de portada:', err);
      alert('Ocurrió un error al procesar la imagen de portada.');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isImageDataUrl(config.heroImagenUrl)) {
        const heroSize = getDataUrlByteSize(config.heroImagenUrl);
        if (heroSize > MAX_HERO_IMAGE_BYTES) {
          alert('La imagen de portada supera 200 KB. Comprime la imagen o usa una URL externa antes de guardar.');
          return;
        }
      }

      await setDoc(doc(db, 'configuracion', 'general'), {
        ...config,
        actualizadoPor: userData?.email || '',
        actualizadoEn: new Date(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error al guardar:', err);
      alert('Error al guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#D4AF37]" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-[var(--text-primary)]">Configuración General</h1>
          <p className="text-[var(--text-secondary)] mt-1">Gestiona los datos de contacto, imagen de portada y redes sociales</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || uploadingHero}
          className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#b8952d] disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm cursor-pointer"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
        </button>
      </div>

      {/* Imagen de Portada Principal (Hero) */}
      <Section title="Imagen de Portada Principal (Hero)" icon={<ImageIcon size={20} className="text-[#D4AF37]" />}>
        <input
          type="file"
          ref={heroFileInputRef}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleHeroFileSelected(e.target.files[0]);
            }
          }}
        />

        <div className="space-y-4">
          
          {/* Tarjeta de Guía / Ayuda Memoria */}
          <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-2xl p-4 text-xs text-gray-800 dark:text-gray-200 flex items-start gap-3.5 shadow-xs">
            <div className="w-8 h-8 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] flex items-center justify-center shrink-0 mt-0.5">
              <HelpCircle size={18} />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="font-bold text-[#D4AF37] text-xs uppercase tracking-wider">Guía & Especificaciones Recomendadas para la Foto de Portada</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[0.8rem] text-gray-600 dark:text-gray-300">
                <div>
                  <strong className="text-gray-800 dark:text-gray-200">📐 Dimensiones:</strong> 1920 × 1080 px (Panorámica 16:9 Full HD) o mínimo 1600 × 900 px.
                </div>
                <div>
                  <strong className="text-gray-800 dark:text-gray-200">🖼️ Formatos:</strong> JPG, JPEG o WEBP (los mejores para fotos).
                </div>
                <div>
                  <strong className="text-gray-800 dark:text-gray-200">✨ Composición:</strong> Foto con montaje o sujeto al centro o derecha (para dejar espacio a la izquierda).
                </div>
                <div>
                  <strong className="text-gray-800 dark:text-gray-200">⚡ Compresión:</strong> Automática (el sistema la optimiza a menos de 300 KB).
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de vista previa con botón directo */}
          <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] bg-gray-900 shadow-md">
            <img
              src={config.heroImagenUrl || '/images/extracted/img_6.jpeg'}
              alt="Portada Principal Hero"
              className="w-full h-56 object-cover block"
            />

            {/* Overlay estático para cambiar imagen fácilmente */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-4">
              <button
                type="button"
                onClick={() => heroFileInputRef.current?.click()}
                disabled={uploadingHero}
                className="bg-[#D4AF37] hover:bg-[#b8952d] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer border border-white/20"
              >
                {uploadingHero ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                {uploadingHero ? 'Optimizando foto...' : '📷 Seleccionar nueva foto de portada'}
              </button>
            </div>
          </div>

          <Field
            label="URL externa de imagen de portada"
            value={config.heroImagenUrl}
            onChange={v => handleChange('heroImagenUrl', v)}
            placeholder="https://ejemplo.com/imagen-hero.webp"
            hint="Recomendado para SEO si tienes una imagen alojada fuera de Firebase Storage. Tambien puedes usar el boton para guardar una imagen comprimida menor a 200 KB."
          />

          {/* Acciones adicionales en la parte inferior */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => heroFileInputRef.current?.click()}
              className="text-xs text-[#D4AF37] font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud size={15} />
              Explorar imagen desde tu equipo o celular
            </button>

            <button
              type="button"
              onClick={() => {
                setConfig(prev => ({ ...prev, heroImagenUrl: '/images/extracted/img_6.jpeg' }));
                setSaved(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              Restablecer foto original
            </button>
          </div>
        </div>
      </Section>

      {/* Información del negocio */}
      <Section title="Información del Negocio">
        <Field label="Nombre del negocio" value={config.nombreNegocio} onChange={v => handleChange('nombreNegocio', v)} placeholder="RMC EVENTOS" />
        <Field label="Slogan / Frase de presentación" value={config.slogan} onChange={v => handleChange('slogan', v)} placeholder="Hacemos de tu evento algo inolvidable" />
        <Field label="Horario de atención" value={config.horarioAtencion} onChange={v => handleChange('horarioAtencion', v)} placeholder="Lunes a Sábado: 9:00 - 18:00" />
      </Section>

      {/* Contacto */}
      <Section title="Datos de Contacto" icon={<Phone size={20} className="text-[#D4AF37]" />}>
        <Field
          label="Número de WhatsApp"
          value={config.whatsappNumero}
          onChange={v => handleChange('whatsappNumero', v)}
          placeholder="59172601952"
          hint="Con código de país, sin + ni espacios. Ej: 59172601952"
        />
        <Field
          label="Teléfono para mostrar"
          value={config.telefonoMostrar}
          onChange={v => handleChange('telefonoMostrar', v)}
          placeholder="+591 72601952"
          hint="Cómo se muestra en la página. Ej: +591 72601952"
        />
        <Field label="Correo de contacto" value={config.correoContacto} onChange={v => handleChange('correoContacto', v)} placeholder="rmc.eventos2631@gmail.com" icon={<Mail size={16} className="text-[var(--text-secondary)]" />} />
        <Field label="Ciudad" value={config.ciudad} onChange={v => handleChange('ciudad', v)} placeholder="Santa Cruz, Bolivia" icon={<MapPin size={16} className="text-[var(--text-secondary)]" />} />
        <Field label="Dirección" value={config.direccion} onChange={v => handleChange('direccion', v)} placeholder="Av. Ejemplo #123, Barrio..." />
      </Section>

      {/* Redes Sociales */}
      <Section title="Redes Sociales" icon={<Globe size={20} className="text-[#D4AF37]" />}>
        <Field label="Instagram" value={config.instagramUrl} onChange={v => handleChange('instagramUrl', v)} placeholder="https://instagram.com/rmceventos" />
        <Field label="Facebook" value={config.facebookUrl} onChange={v => handleChange('facebookUrl', v)} placeholder="https://facebook.com/rmceventos" />
        <Field label="TikTok" value={config.tiktokUrl} onChange={v => handleChange('tiktokUrl', v)} placeholder="https://tiktok.com/@rmceventos" />
      </Section>

      {/* Preview WhatsApp */}
      {config.whatsappNumero && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={18} className="text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-400 text-sm">Vista previa del enlace de WhatsApp</span>
          </div>
          <a
            href={`https://wa.me/${config.whatsappNumero}?text=Hola,%20me%20interesa%20cotizar%20un%20evento`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-green-600 dark:text-green-400 underline break-all font-mono"
          >
            https://wa.me/{config.whatsappNumero}
          </a>
        </div>
      )}
    </div>
  );
};

// ── Componentes auxiliares ──

const Section = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="mb-8">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h2 className="text-lg font-poppins font-semibold text-[var(--text-primary)]">{title}</h2>
    </div>
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4 shadow-sm">
      {children}
    </div>
  </div>
);

interface FieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  icon?: React.ReactNode;
}

const Field = ({ label, value, onChange, placeholder, hint, icon }: FieldProps) => (
  <div>
    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">{label}</label>
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/40 focus:border-[#D4AF37] transition-all ${icon ? 'pl-9' : ''}`}
      />
    </div>
    {hint && <p className="text-xs text-[var(--text-secondary)] mt-1">{hint}</p>}
  </div>
);

export default ConfiguracionPage;

function isImageDataUrl(value: string) {
  return /^data:image\/(jpeg|jpg|png|webp);base64,/.test(value);
}

function getDataUrlByteSize(value: string) {
  const base64 = value.split(',')[1] || '';
  return Math.ceil((base64.length * 3) / 4);
}
