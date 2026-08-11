import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Save, Phone, Mail, MapPin, Globe, MessageCircle, Loader2, CheckCircle } from 'lucide-react';

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
};

const ConfiguracionPage = () => {
  const { userData } = useAuth();
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, 'configuracion', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setConfig({ ...defaultConfig, ...docSnap.data() } as SiteConfig);
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

  const handleSave = async () => {
    setSaving(true);
    try {
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
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-dorado" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-[var(--text-primary)]">Configuración</h1>
          <p className="text-[var(--text-secondary)] mt-1">Datos de contacto y redes sociales del sitio web</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-dorado hover:bg-dorado/90 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-sm"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      {/* Información del negocio */}
      <Section title="Información del Negocio">
        <Field label="Nombre del negocio" value={config.nombreNegocio} onChange={v => handleChange('nombreNegocio', v)} placeholder="RMC EVENTOS" />
        <Field label="Slogan" value={config.slogan} onChange={v => handleChange('slogan', v)} placeholder="Hacemos de tu evento algo inolvidable" />
        <Field label="Horario de atención" value={config.horarioAtencion} onChange={v => handleChange('horarioAtencion', v)} placeholder="Lunes a Sábado: 9:00 - 18:00" />
      </Section>

      {/* Contacto */}
      <Section title="Datos de Contacto" icon={<Phone size={20} className="text-dorado" />}>
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
        <Field label="Correo de contacto" value={config.correoContacto} onChange={v => handleChange('correoContacto', v)} placeholder="rmceventos@gmail.com" icon={<Mail size={16} className="text-[var(--text-secondary)]" />} />
        <Field label="Ciudad" value={config.ciudad} onChange={v => handleChange('ciudad', v)} placeholder="Santa Cruz, Bolivia" icon={<MapPin size={16} className="text-[var(--text-secondary)]" />} />
        <Field label="Dirección" value={config.direccion} onChange={v => handleChange('direccion', v)} placeholder="Av. Ejemplo #123, Barrio..." />
      </Section>

      {/* Redes Sociales */}
      <Section title="Redes Sociales" icon={<Globe size={20} className="text-dorado" />}>
        <Field label="Instagram" value={config.instagramUrl} onChange={v => handleChange('instagramUrl', v)} placeholder="https://instagram.com/rmceventos" />
        <Field label="Facebook" value={config.facebookUrl} onChange={v => handleChange('facebookUrl', v)} placeholder="https://facebook.com/rmceventos" />
        <Field label="TikTok" value={config.tiktokUrl} onChange={v => handleChange('tiktokUrl', v)} placeholder="https://tiktok.com/@rmceventos" />
      </Section>

      {/* Preview WhatsApp */}
      {config.whatsappNumero && (
        <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle size={18} className="text-green-500" />
            <span className="font-medium text-green-700 dark:text-green-400">Vista previa del enlace de WhatsApp</span>
          </div>
          <a
            href={`https://wa.me/${config.whatsappNumero}?text=Hola, me interesa cotizar un evento`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-green-600 dark:text-green-400 underline break-all"
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
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 space-y-4">
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
        className={`w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] px-4 py-2.5 text-sm placeholder:text-[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-dorado/40 focus:border-dorado transition-all ${icon ? 'pl-9' : ''}`}
      />
    </div>
    {hint && <p className="text-xs text-[var(--text-secondary)] mt-1">{hint}</p>}
  </div>
);

export default ConfiguracionPage;
