import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, ShieldAlert } from 'lucide-react';

interface AuditoriaLog {
  id: string;
  usuarioEmail: string;
  accion: string;
  entidadId?: string;
  detalle: string;
  fecha: any;
}

export default function AuditoriaPage() {
  const { userData } = useAuth();
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.rol !== 'superadmin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'auditoria'), orderBy('fecha', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AuditoriaLog));
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userData]);

  const getActionColor = (accion: string) => {
    if (accion.includes('crear') || accion.includes('aprobar')) return 'bg-green-100 text-green-800';
    if (accion.includes('eliminar') || accion.includes('rechazar')) return 'bg-red-100 text-red-800';
    if (accion.includes('editar') || accion.includes('actualizar') || accion.includes('cambiar')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  if (userData?.rol !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-gray-600 dark:text-gray-400">El registro de auditoría es exclusivo para superadministradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Auditoría</h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Fecha</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Usuario</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Acción</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {log.fecha ? new Date(log.fecha?.seconds * 1000).toLocaleString() : ''}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">
                    {log.usuarioEmail}
                  </td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.accion)}`}>
                      {log.accion}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                    {log.detalle}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No hay registros de auditoría recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
