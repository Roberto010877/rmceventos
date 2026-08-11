import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/firebase';
import { logAudit } from '../lib/audit';
import { authenticate, requireRole, validate, sanitizeBody } from '../middleware';

const router = Router();

// Schemas
const servicioUpdateSchema = z.object({
  nombre: z.string().optional(),
  descripcion: z.string().optional(),
  ordenVisualizacion: z.number().optional(),
});

// GET / - List all services
router.get('/', async (req, res, next) => {
  try {
    const snapshot = await db.collection('servicios').orderBy('ordenVisualizacion', 'asc').get();
    const servicios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(servicios);
  } catch (error) {
    next(error);
  }
});

// PATCH /:id - Update service
router.patch('/:id', authenticate, requireRole('admin', 'superadmin'), validate(servicioUpdateSchema), sanitizeBody('nombre', 'descripcion'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const body = req.body;
    const reqAny = req as any;
    const userId = reqAny.user!.uid;
    const userEmail = reqAny.user!.email || 'unknown';
    
    if (Object.keys(body).length === 0) {
      res.status(400).json({ error: 'No se enviaron datos para actualizar' });
      return;
    }
    
    const docRef = db.collection('servicios').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Servicio no encontrado' });
      return;
    }
    
    await docRef.update(body);
    
    await logAudit(userId, userEmail, 'servicio.editar', id, `Cambios: ${JSON.stringify(body)}`);
    
    res.status(200).json({ message: 'Servicio actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
