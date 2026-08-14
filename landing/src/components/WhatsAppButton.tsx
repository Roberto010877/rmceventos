import { MessageCircle } from 'lucide-react';
import { useCompanyConfig } from '../hooks/useCompanyConfig';

const WhatsAppButton = () => {
  const config = useCompanyConfig();

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute -top-12 right-0 bg-dark text-white px-4 py-2 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap shadow-lg shadow-black/50 border border-white/10">
        ¡Escríbenos!
        {/* Tooltip Arrow */}
        <div className="absolute -bottom-2 right-6 w-4 h-4 bg-dark border-b border-r border-white/10 transform rotate-45"></div>
      </div>

      <a
        href={config.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-16 h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(37,211,102,0.4)] hover:shadow-[0_0_30px_rgba(37,211,102,0.6)] hover:-translate-y-1 transition-all duration-300 relative"
      >
        <MessageCircle size={32} />
        {/* Pulse Effect */}
        <div className="absolute inset-0 rounded-full border-2 border-[#25D366] animate-ping opacity-75"></div>
      </a>
    </div>
  );
};

export default WhatsAppButton;
