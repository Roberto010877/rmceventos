import { Request, Response, NextFunction } from 'express';
import { auth, db } from '../lib/firebase';
import { DecodedIdToken } from 'firebase-admin/auth';

/** Roles del sistema — debe coincidir con shared/models/usuario.ts */
type Rol = 'editor' | 'admin' | 'superadmin';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & { rol?: Rol };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Falta el token de autorización o el formato es incorrecto.' });
    return;
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await auth.verifyIdToken(token);
    const userDoc = await db.collection('usuarios').doc(decodedToken.uid).get();
    const rol = userDoc.exists ? (userDoc.data()?.rol as Rol | undefined) : undefined;

    req.user = { ...decodedToken, rol } as DecodedIdToken & { rol?: Rol };
    next();
  } catch (error) {
    console.error('Error al verificar el token:', error);
    res.status(401).json({ error: 'Token de autorización inválido o expirado.' });
  }
};
