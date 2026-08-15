import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { collection, doc, getDoc, getDocs, limit, query, setDoc, where } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';

type Rol = 'editor' | 'admin' | 'superadmin';

interface UserData {
  uid: string;
  email: string;
  nombre: string;
  rol: Rol;
  photoURL?: string;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Email del primer superadmin — se usa solo para el bootstrap inicial */
const SUPERADMIN_EMAIL = 'melgar.robertocarlos@gmail.com';
const ROLES: Rol[] = ['editor', 'admin', 'superadmin'];

const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() || '';

const isRol = (rol: unknown): rol is Rol => typeof rol === 'string' && ROLES.includes(rol as Rol);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setError(null);

      if (firebaseUser) {
        try {
          const normalizedEmail = normalizeEmail(firebaseUser.email);
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          let userDoc = await getDoc(userDocRef);

          // Bootstrap: si el usuario es el superadmin y no tiene documento, crearlo
          if (!userDoc.exists() && normalizedEmail === SUPERADMIN_EMAIL) {
            console.log('🔑 Bootstrap: creando documento de superadmin...');
            await setDoc(userDocRef, {
              email: normalizedEmail,
              nombre: firebaseUser.displayName || 'Administrador',
              rol: 'superadmin' as Rol,
              fechaAlta: new Date(),
              estado: 'activo',
              photoURL: firebaseUser.photoURL || null,
            });
            userDoc = await getDoc(userDocRef);
          }

          if (!userDoc.exists() && normalizedEmail) {
            const pendingUserRef = doc(db, 'usuarios', normalizedEmail);
            let pendingUserDoc = await getDoc(pendingUserRef);
            let pendingUserId = normalizedEmail;

            if (!pendingUserDoc.exists()) {
              const legacyPendingQuery = query(
                collection(db, 'usuarios'),
                where('email', '==', normalizedEmail),
                limit(1)
              );
              const legacyPendingSnapshot = await getDocs(legacyPendingQuery);

              if (!legacyPendingSnapshot.empty) {
                pendingUserDoc = legacyPendingSnapshot.docs[0];
                pendingUserId = pendingUserDoc.id;
              }
            }

            if (pendingUserDoc.exists()) {
              const pendingData = pendingUserDoc.data();
              const pendingEmail = normalizeEmail(pendingData.email);

              if (pendingEmail === normalizedEmail && isRol(pendingData.rol)) {
                await setDoc(userDocRef, {
                  email: normalizedEmail,
                  nombre: pendingData.nombre || firebaseUser.displayName || '',
                  rol: pendingData.rol,
                  fechaAlta: pendingData.fechaAlta || new Date(),
                  fechaActivacion: new Date(),
                  estado: 'activo',
                  photoURL: firebaseUser.photoURL || null,
                  preRegistroId: pendingUserId,
                });
                userDoc = await getDoc(userDocRef);
              }
            }
          }

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              uid: firebaseUser.uid,
              email: normalizedEmail,
              nombre: data.nombre || firebaseUser.displayName || '',
              rol: data.rol as Rol,
              photoURL: firebaseUser.photoURL || undefined,
            });
          } else {
            // Usuario autenticado pero sin registro en 'usuarios' → sin acceso
            setUserData(null);
            setError('No tienes permisos para acceder al panel. Contacta al administrador.');
          }
        } catch (err) {
          console.error('Error al obtener datos del usuario:', err);
          setUserData(null);
          setError('Error al verificar permisos. Intenta de nuevo.');
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError(null); // No mostrar error si el usuario cerró el popup
      } else {
        setError('Error al iniciar sesión con Google.');
        console.error(err);
      }
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, error, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
