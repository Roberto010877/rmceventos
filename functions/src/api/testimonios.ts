import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/firebase';
import { logAudit } from '../lib/audit';
import { authenticate, requireRole, validate, sanitizeBody, publicRateLimiter } from '../middleware';

const router = Router();

// Schemas
const testimonioCreateSchema = z.object({
  nombreCliente: z.string().min(1),
  tipoEvento: z.enum(['boda', 'aniversario', 'corporativo', 'cumpleanos', 'otro']).optional(),
  mensaje: z.string().min(1),
});

const testimonioUpdateSchema = z.object({
  aprobado: z.boolean(),
});

const testimonioQuerySchema = z.object({
  aprobado: z.enum(['true', 'false']).optional(),
});

// POST / - Submit testimonial
router.post('/', publicRateLimiter, validate(testimonioCreateSchema), sanitizeBody('nombreCliente', 'mensaje'), async (req, res, next) => {
  try {
    const body = req.body;
    
    const nuevoTestimonio = {
      ...body,
      aprobado: false,
      fecha: new Date()
    };
    
    const docRef = await db.collection('testimonios').add(nuevoTestimonio);
    
    res.status(201).json({ id: docRef.id, message: 'Testimonio enviado para revisión' });
  } catch (error) {
    next(error);
  }
});

// GET / - List all testimonials
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { aprobado } = testimonioQuerySchema.parse(req.query);
    
    let query = db.collection('testimonios').orderBy('fecha', 'desc');
    
    if (aprobado !== undefined) {
      const isApproved = aprobado === 'true';
      query = query.where('aprobado', '==', isApproved);
    }
    
    const snapshot = await query.get();
    const testimonios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(testimonios);
  } catch (error) {
    next(error);
  }
});

// PATCH /:id - Approve/reject testimonial
router.patch('/:id', authenticate, requireRole('admin'), validate(testimonioUpdateSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { aprobado } = req.body;
    const userId = (req as any).user!.uid;
    const userEmail = (req as any).user!.email || 'unknown';
    
    const docRef = db.collection('testimonios').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Testimonio no encontrado' });
      return;
    }
    
    await docRef.update({ aprobado });
    
    const action = aprobado ? 'testimonio.aprobar' : 'testimonio.rechazar';
    await logAudit(userId, userEmail, action, id);
    
    res.status(200).json({ message: `Testimonio ${aprobado ? 'aprobado' : 'rechazado'}` });
  } catch (error) {
    next(error);
  }
});

export default router;
