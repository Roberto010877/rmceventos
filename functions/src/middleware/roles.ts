import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

/** Roles del sistema — debe coincidir con shared/models/usuario.ts */
type Rol = 'editor' | 'admin' | 'superadmin';

const roleHierarchy: Record<Rol, number> = {
  editor: 1,
  admin: 2,
  superadmin: 3
};

/**
 * Middleware para verificar si el usuario tiene el rol necesario.
 * Respeta la jerarquía: superadmin > admin > editor
 */
export const requireRole = (...allowedRoles: Rol[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Acceso denegado: Usuario no autenticado.' });
      return;
    }

    if (!req.user.rol) {
      res.status(403).json({ error: 'Acceso denegado: No tienes un rol asignado.' });
      return;
    }

    const userRole = req.user.rol;
    let hasAccess = false;
    
    for (const allowedRole of allowedRoles) {
      if (roleHierarchy[userRole] >= roleHierarchy[allowedRole]) {
        hasAccess = true;
        break;
      }
    }

    if (!hasAccess) {
      res.status(403).json({ error: 'Acceso denegado: Permisos insuficientes para esta acción.' });
      return;
    }

    next();
  };
};
