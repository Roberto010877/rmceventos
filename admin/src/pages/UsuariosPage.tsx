import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, addDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, Shield, Plus, X, Trash2 } from 'lucide-react';

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  fechaAlta: any;
  estado?: 'pendiente' | 'activo' | string;
  preRegistroId?: string;
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const formatFecha = (fecha: any) => {
  if (!fecha) return '-';
  if (typeof fecha.toDate === 'function') return fecha.toDate().toLocaleDateString();
  if (fecha.seconds) return new Date(fecha.seconds * 1000).toLocaleDateString();
  return new Date(fecha).toLocaleDateString();
};

const getEstadoUsuario = (usuario: Usuario, currentUserEmail?: string) => {
  if (usuario.estado === 'activo' || normalizeEmail(usuario.email || '') === normalizeEmail(currentUserEmail || '')) {
    return 'activo';
  }

  return 'pendiente';
};

export default function UsuariosPage() {
  const { userData } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newForm, setNewForm] = useState({ nombre: '', email: '', rol: 'editor' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only superadmin should be able to read this collection per rules, but handled in view check too
    if (userData?.rol !== 'superadmin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'usuarios'), orderBy('fechaAlta', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Usuario));
      setUsuarios(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userData]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!userData) return;
    try {
      await updateDoc(doc(db, 'usuarios', userId), { rol: newRole });
      await addDoc(collection(db, 'auditoria'), {
        usuarioId: userData.uid,
        usuarioEmail: userData.email,
        accion: 'usuario.cambiar_rol',
        entidadId: userId,
        detalle: `Rol cambiado a ${newRole}`,
        fecha: new Date()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (usuario: Usuario) => {
    if (!userData || usuario.email === userData.email) return;

    const confirmed = window.confirm(`Eliminar el acceso de ${usuario.email}?`);
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'usuarios', usuario.id));
      await addDoc(collection(db, 'auditoria'), {
        usuarioId: userData.uid,
        usuarioEmail: userData.email,
        accion: 'usuario.eliminar',
        entidadId: usuario.id,
        detalle: `Usuario eliminado: ${usuario.email}`,
        fecha: new Date()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;
    setSubmitting(true);
    try {
      const normalizedEmail = normalizeEmail(newForm.email);
      await setDoc(doc(db, 'usuarios', normalizedEmail), {
        nombre: newForm.nombre.trim(),
        email: normalizedEmail,
        rol: newForm.rol,
        estado: 'pendiente',
        fechaAlta: new Date()
      }, { merge: true });
      await addDoc(collection(db, 'auditoria'), {
        usuarioId: userData.uid,
        usuarioEmail: userData.email,
        accion: 'usuario.crear',
        entidadId: normalizedEmail,
        detalle: `Usuario pre-creado: ${normalizedEmail} con rol ${newForm.rol}`,
        fecha: new Date()
      });
      setShowModal(false);
      setNewForm({ nombre: '', email: '', rol: 'editor' });
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#D4AF37]" size={32} /></div>;

  if (userData?.rol !== 'superadmin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Shield className="text-red-500 mb-4" size={64} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-gray-600 dark:text-gray-400">Esta sección es exclusiva para superadministradores.</p>
      </div>
    );
  }

  const activeEmails = new Set(
    usuarios
      .filter(usuario => getEstadoUsuario(usuario, userData.email) === 'activo')
      .map(usuario => normalizeEmail(usuario.email || ''))
  );
  const visibleUsuarios = usuarios.filter(usuario => {
    const email = normalizeEmail(usuario.email || '');
    return getEstadoUsuario(usuario, userData.email) === 'activo' || !activeEmails.has(email);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-[#D4AF37] text-white px-4 py-2 rounded-lg hover:bg-[#b8952d] transition-colors"
        >
          <Plus size={20} />
          Agregar usuario
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Nombre</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Email</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Estado</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Rol</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Fecha de Alta</th>
                <th className="p-4 text-sm font-semibold text-gray-900 dark:text-white">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {visibleUsuarios.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="p-4 text-sm font-medium text-gray-900 dark:text-white">{user.nombre}</td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                  <td className="p-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      getEstadoUsuario(user, userData.email) === 'activo'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}>
                      {getEstadoUsuario(user, userData.email) === 'activo' ? 'Activo' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    <select 
                      value={user.rol}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={user.email === userData.email}
                      className="p-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    {formatFecha(user.fechaAlta)}
                  </td>
                  <td className="p-4 text-sm">
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={user.email === userData.email}
                      className="rounded p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-900/20"
                      title="Eliminar usuario"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Pre-registrar Usuario</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              El usuario deberá iniciar sesión con Google usando este correo para activar su cuenta.
            </p>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
                <input 
                  type="text" required 
                  value={newForm.nombre} onChange={e => setNewForm({...newForm, nombre: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo (Google)</label>
                <input 
                  type="email" required 
                  value={newForm.email} onChange={e => setNewForm({...newForm, email: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                <select 
                  value={newForm.rol} onChange={e => setNewForm({...newForm, rol: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-[#D4AF37] text-white py-2 px-4 rounded-md hover:bg-[#b8952d] transition-colors disabled:opacity-50"
              >
                {submitting ? 'Guardando...' : 'Registrar usuario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
