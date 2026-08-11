import { Router } from 'express';
import { z } from 'zod';
import { auth, db } from '../lib/firebase';
import { logAudit } from '../lib/audit';
import { authenticate, requireRole, validate } from '../middleware';

const router = Router();

// Schemas
const usuarioRolUpdateSchema = z.object({
  rol: z.enum(['editor', 'admin', 'superadmin']),
});

// GET / - List all admin users
router.get('/', authenticate, requireRole('superadmin'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('usuarios').get();
    const usuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
});

// PATCH /:id/rol - Change user role
router.patch('/:id/rol', authenticate, requireRole('superadmin'), validate(usuarioRolUpdateSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { rol } = req.body;
    const reqAny = req as any;
    const adminId = reqAny.user!.uid;
    const adminEmail = reqAny.user!.email || 'unknown';
    
    // Check safety: Cannot change own role
    if (id === adminId) {
      res.status(403).json({ error: 'No puedes cambiar tu propio rol' });
      return;
    }
    
    const docRef = db.collection('usuarios').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    
    // Update Custom Claims
    await auth.setCustomUserClaims(id, { rol });
    
    // Update Firestore document
    await docRef.update({ rol });
    
    // Log Audit
    await logAudit(adminId, adminEmail, 'usuario.cambiar_rol', id, `Nuevo rol: ${rol}`);
    
    res.status(200).json({ message: 'Rol de usuario actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
