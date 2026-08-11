import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
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
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          let userDoc = await getDoc(userDocRef);

          // Bootstrap: si el usuario es el superadmin y no tiene documento, crearlo
          if (!userDoc.exists() && firebaseUser.email === SUPERADMIN_EMAIL) {
            console.log('🔑 Bootstrap: creando documento de superadmin...');
            await setDoc(userDocRef, {
              email: firebaseUser.email,
              nombre: firebaseUser.displayName || 'Administrador',
              rol: 'superadmin' as Rol,
              fechaAlta: new Date(),
              photoURL: firebaseUser.photoURL || null,
            });
            userDoc = await getDoc(userDocRef);
          }

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
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
