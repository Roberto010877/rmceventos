import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useFeedback } from '../components/ui/feedback';
import { Plus, Edit2, Trash2, Calendar, Loader2, X, CheckCircle2, Search, MapPin, Users } from 'lucide-react';

export type EstadoEvento = 'cotizacion' | 'confirmado' | 'en_montaje' | 'finalizado' | 'cancelado';

interface Evento {
  id: string;
  nombre: string;
  tipoEvento: string;
  fecha: string;
  clienteNombre: string;
  clienteTelefono?: string;
  ubicacion?: string;
  invitados?: number;
  presupuestoBs?: number;
  estado: EstadoEvento;
  serviciosContratados?: string[];
  descripcion: string;
}

export default function EventosPage() {
  const { userData } = useAuth();
  const { toast, confirm } = useFeedback();
  const canManageEvents = userData?.rol === 'admin' || userData?.rol === 'superadmin';
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [search, setSearch] = useState('');
  
  // Form state con campos extendidos
  const [formData, setFormData] = useState({
    nombre: '',
    tipoEvento: 'boda',
    fecha: '',
    clienteNombre: '',
    clienteTelefono: '',
    ubicacion: '',
    invitados: 100,
    presupuestoBs: 0,
    estado: 'cotizacion' as EstadoEvento,
    serviciosContratados: ['decoracion'] as string[],
    descripcion: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'eventos'), orderBy('fecha', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => {
        const item = d.data();
        return {
          id: d.id,
          nombre: item.nombre || 'Evento sin nombre',
          tipoEvento: item.tipoEvento || 'boda',
          fecha: item.fecha || '',
          clienteNombre: item.clienteNombre || '',
          clienteTelefono: item.clienteTelefono || '',
          ubicacion: item.ubicacion || '',
          invitados: item.invitados || 0,
          presupuestoBs: item.presupuestoBs || 0,
          estado: (item.estado as EstadoEvento) || 'confirmado',
          serviciosContratados: item.serviciosContratados || ['decoracion'],
          descripcion: item.descripcion || ''
        } as Evento;
      });
      setEventos(data);
      setLoading(false);
    }, (err) => {
      console.error('Error al cargar eventos:', err);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (evento?: Evento) => {
    if (!canManageEvents) return;

    if (evento) {
      setEditingId(evento.id);
      setFormData({
        nombre: evento.nombre,
        tipoEvento: evento.tipoEvento,
        fecha: evento.fecha,
        clienteNombre: evento.clienteNombre,
        clienteTelefono: evento.clienteTelefono || '',
        ubicacion: evento.ubicacion || '',
        invitados: evento.invitados || 100,
        presupuestoBs: evento.presupuestoBs || 0,
        estado: evento.estado || 'confirmado',
        serviciosContratados: evento.serviciosContratados || ['decoracion'],
        descripcion: evento.descripcion || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre: '',
        tipoEvento: 'boda',
        fecha: new Date().toISOString().split('T')[0],
        clienteNombre: '',
        clienteTelefono: '',
        ubicacion: 'Santa Cruz, Bolivia',
        invitados: 100,
        presupuestoBs: 0,
        estado: 'cotizacion',
        serviciosContratados: ['decoracion'],
        descripcion: ''
      });
    }
    setShowModal(true);
  };

  const handleToggleServicio = (servId: string) => {
    setFormData(prev => {
      const exists = prev.serviciosContratados.includes(servId);
      return {
        ...prev,
        serviciosContratados: exists
          ? prev.serviciosContratados.filter(s => s !== servId)
          : [...prev.serviciosContratados, servId]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !canManageEvents) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'eventos', editingId), formData);
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'evento.editar',
          entidadId: editingId,
          detalle: `Evento editado: ${formData.nombre}`,
          fecha: new Date()
        });
      } else {
        const newDoc = await addDoc(collection(db, 'eventos'), {
          ...formData,
          creadoPor: userData.email,
          creadoEn: new Date()
        });
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'evento.crear',
          entidadId: newDoc.id,
          detalle: `Evento creado: ${formData.nombre}`,
          fecha: new Date()
        });
      }
      setShowModal(false);
    } catch (error: any) {
      console.error('Error al guardar evento:', error);
      toast({ type: 'error', message: `Error al guardar evento: ${error.message || 'Verifica la conexión.'}` });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (evento: Evento) => {
    if (!canManageEvents) return;

    const confirmed = await confirm({
      title: 'Eliminar evento',
      message: `¿Estás seguro de eliminar el evento "${evento.nombre}"? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      tone: 'danger',
    });

    if (confirmed) {
      await deleteDoc(doc(db, 'eventos', evento.id));
      if (userData) {
        await addDoc(collection(db, 'auditoria'), {
          usuarioId: userData.uid,
          usuarioEmail: userData.email,
          accion: 'evento.eliminar',
          entidadId: evento.id,
          detalle: `Evento eliminado: ${evento.nombre}`,
          fecha: new Date()
        });
      }
    }
  };

  const getEstadoBadge = (estado: EstadoEvento) => {
    switch (estado) {
      case 'cotizacion':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Cotización</span>;
      case 'confirmado':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">Confirmado</span>;
      case 'en_montaje':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">En montaje</span>;
      case 'finalizado':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">Finalizado</span>;
      case 'cancelado':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">Cancelado</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-800">Evento</span>;
    }
  };

  const filteredEventos = eventos.filter(e => {
    if (filterEstado !== 'todos' && e.estado !== filterEstado) return false;

    const queryText = search.trim().toLowerCase();
    if (!queryText) return true;

    return [
      e.nombre,
      e.tipoEvento,
      e.fecha,
      e.clienteNombre,
      e.clienteTelefono,
      e.ubicacion,
      e.descripcion,
      e.estado,
    ].some(value => String(value || '').toLowerCase().includes(queryText));
  });

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#D4AF37]" size={36} /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-poppins text-gray-900 dark:text-white">Agenda de Eventos</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Administra cotizaciones, fechas de montaje y clientes de RMC Eventos ({eventos.length} eventos)</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar evento, cliente o teléfono"
              className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-[#D4AF37] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {canManageEvents && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#b8952d] text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm cursor-pointer"
            >
              <Plus size={20} />
              Crear Nuevo Evento
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'todos', label: `Todos (${eventos.length})` },
          { id: 'cotizacion', label: `Cotizaciones (${eventos.filter(e => e.estado === 'cotizacion').length})` },
          { id: 'confirmado', label: `Confirmados (${eventos.filter(e => e.estado === 'confirmado').length})` },
          { id: 'en_montaje', label: `En montaje (${eventos.filter(e => e.estado === 'en_montaje').length})` },
          { id: 'finalizado', label: `Finalizados (${eventos.filter(e => e.estado === 'finalizado').length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterEstado(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
              filterEstado === tab.id 
                ? 'bg-[#D4AF37] text-white shadow-xs' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table List */}
      {filteredEventos.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 space-y-3">
          <Calendar className="mx-auto text-gray-400" size={48} />
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">No hay eventos registrados en esta categoria</p>
          {canManageEvents && (
            <button
              onClick={() => handleOpenModal()}
              className="text-xs text-[#D4AF37] font-bold hover:underline"
            >
              + Registrar primer evento
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="grid gap-4 md:hidden">
          {filteredEventos.map(evento => (
            <div key={evento.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-gray-900 dark:text-white">{evento.nombre}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {evento.clienteNombre} {evento.clienteTelefono && `(${evento.clienteTelefono})`}
                  </p>
                </div>
                {getEstadoBadge(evento.estado)}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                <div>
                  <span className="block font-bold uppercase tracking-wide text-gray-400">Fecha</span>
                  <span className="mt-1 block font-semibold">{evento.fecha || '-'}</span>
                </div>
                <div>
                  <span className="block font-bold uppercase tracking-wide text-gray-400">Tipo</span>
                  <span className="mt-1 block capitalize font-semibold">{evento.tipoEvento}</span>
                </div>
                <div className="flex gap-2">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                  <span>{evento.ubicacion || 'Santa Cruz'}</span>
                </div>
                <div className="flex gap-2">
                  <Users size={14} className="mt-0.5 shrink-0 text-[#D4AF37]" />
                  <span>{evento.invitados || 0} invitados</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {evento.presupuestoBs ? `Bs. ${evento.presupuestoBs.toLocaleString()}` : 'Sin monto'}
                </span>
                {canManageEvents ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(evento)}
                      className="p-2 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors"
                      title="Editar evento"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(evento)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar evento"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-medium text-gray-400">Solo lectura</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700 uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                  <th className="p-4">Evento / Cliente</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Ubicación</th>
                  <th className="p-4">Invitados</th>
                  <th className="p-4">Monto (Bs.)</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredEventos.map(evento => (
                  <tr key={evento.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-4">
                      <b className="block text-sm font-bold text-gray-900 dark:text-white">{evento.nombre}</b>
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        {evento.clienteNombre} {evento.clienteTelefono && `(${evento.clienteTelefono})`}
                      </span>
                    </td>
                    <td className="p-4 capitalize font-semibold text-gray-700 dark:text-gray-300">
                      {evento.tipoEvento}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 font-medium">
                      {evento.fecha}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">
                      {evento.ubicacion || 'Santa Cruz'}
                    </td>
                    <td className="p-4 text-gray-700 dark:text-gray-300 font-semibold">
                      {evento.invitados || 0}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {evento.presupuestoBs ? `Bs. ${evento.presupuestoBs.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4">
                      {getEstadoBadge(evento.estado)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        {canManageEvents ? (
                          <>
                            <button
                              onClick={() => handleOpenModal(evento)}
                              className="p-1.5 text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition-colors cursor-pointer"
                              title="Editar evento"
                            >
                              <Edit2 size={16} />
                            </button>
                          <button 
                            onClick={() => handleDelete(evento)} 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar evento"
                          >
                            <Trash2 size={16} />
                          </button>
                          </>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">Solo lectura</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Modal Crear / Editar Evento Completo */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center pb-3 mb-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold font-poppins text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar size={22} className="text-[#D4AF37]" />
                {editingId ? 'Editar Datos del Evento' : 'Registrar Nuevo Evento'}
              </h2>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Sección 1: Información Básica */}
              <div className="space-y-3">
                <h3 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[0.7rem] border-b border-[#D4AF37]/20 pb-1">
                  1. Información del Evento
                </h3>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre del Evento *</label>
                  <input 
                    type="text" required 
                    placeholder="Ej. Boda de Ana & Carlos"
                    value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})}
                    className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Tipo de Evento</label>
                    <select 
                      value={formData.tipoEvento} onChange={e => setFormData({...formData, tipoEvento: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="boda">Boda / Matrimonio</option>
                      <option value="quinceanero">Quinceañero / 15 Años</option>
                      <option value="corporativo">Evento Corporativo</option>
                      <option value="cumpleanos">Cumpleaños / Aniversario</option>
                      <option value="graduacion">Graduación</option>
                      <option value="otro">Otro tipo de evento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Fecha del Evento *</label>
                    <input 
                      type="date" required 
                      value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Ubicación / Salón</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Salón Urubó, Hotel Los Tajibos..."
                      value={formData.ubicacion} onChange={e => setFormData({...formData, ubicacion: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Estado del Evento</label>
                    <select 
                      value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value as EstadoEvento})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#D4AF37]"
                    >
                      <option value="cotizacion">Cotización (borrador)</option>
                      <option value="confirmado">Confirmado (Reserva pagada)</option>
                      <option value="en_montaje">En montaje / En proceso</option>
                      <option value="finalizado">Finalizado con éxito</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Sección 2: Cliente & Presupuesto */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[0.7rem] border-b border-[#D4AF37]/20 pb-1">
                  2. Datos del Cliente & Logística
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Nombre del Cliente *</label>
                    <input 
                      type="text" required 
                      placeholder="Nombre del novio / anfitrión"
                      value={formData.clienteNombre} onChange={e => setFormData({...formData, clienteNombre: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Teléfono / WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="+591 7XXXXXXX"
                      value={formData.clienteTelefono} onChange={e => setFormData({...formData, clienteTelefono: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Número de Invitados</label>
                    <input 
                      type="number" min="1" 
                      value={formData.invitados} onChange={e => setFormData({...formData, invitados: parseInt(e.target.value) || 0})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Monto Cotizado (Bs.)</label>
                    <input 
                      type="number" min="0" step="100"
                      placeholder="Ej. 15000"
                      value={formData.presupuestoBs} onChange={e => setFormData({...formData, presupuestoBs: parseFloat(e.target.value) || 0})}
                      className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 3: Servicios Contratados */}
              <div className="space-y-2 pt-2">
                <h3 className="font-bold text-[#D4AF37] uppercase tracking-wider text-[0.7rem] border-b border-[#D4AF37]/20 pb-1">
                  3. Servicios Solicitados / Contratados
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'decoracion', label: 'Decoracion' },
                    { id: 'mobiliario', label: 'Mobiliario & Menaje' },
                    { id: 'banqueteria', label: 'Banqueteria' }
                  ].map(s => {
                    const active = formData.serviciosContratados.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleToggleServicio(s.id)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                          active
                            ? 'bg-[#D4AF37] border-[#D4AF37] text-white shadow-xs'
                            : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sección 4: Observaciones */}
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Notas u Observaciones del Evento</label>
                <textarea 
                  value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                  rows={3}
                  placeholder="Detalles sobre colores, estilo floral o requerimientos del cliente..."
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={submitting}
                  className="w-2/3 bg-[#D4AF37] hover:bg-[#b8952d] text-white py-3 rounded-xl font-bold text-xs transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {submitting ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Registrar Evento')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
