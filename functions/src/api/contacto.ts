import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/firebase';
import { authenticate, requireRole, validate, sanitizeBody, contactRateLimiter } from '../middleware';

const router = Router();

// Schemas
const contactoCreateSchema = z.object({
  nombre: z.string().min(1),
  correo: z.string().email(),
  telefono: z.string().min(1),
  tipoEvento: z.enum(['boda', 'aniversario', 'corporativo', 'cumpleanos', 'otro']).optional(),
  mensaje: z.string().min(1),
});

const contactoUpdateSchema = z.object({
  atendido: z.boolean(),
});

// POST / - Submit contact message
router.post('/', contactRateLimiter, validate(contactoCreateSchema), sanitizeBody('nombre', 'mensaje'), async (req, res, next) => {
  try {
    const body = req.body;
    
    const nuevoContacto = {
      ...body,
      fecha: new Date(),
      atendido: false
    };
    
    const docRef = await db.collection('contactos').add(nuevoContacto);
    
    // TODO: Trigger email notification via Firestore trigger (e.g. using Resend)
    
    res.status(201).json({ id: docRef.id, message: 'Mensaje de contacto enviado' });
  } catch (error) {
    next(error);
  }
});

// GET / - List contact messages
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('contactos').orderBy('fecha', 'desc').get();
    const contactos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(contactos);
  } catch (error) {
    next(error);
  }
});

// PATCH /:id - Mark as attended
router.patch('/:id', authenticate, requireRole('admin'), validate(contactoUpdateSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { atendido } = req.body;
    
    const docRef = db.collection('contactos').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Mensaje de contacto no encontrado' });
      return;
    }
    
    await docRef.update({ atendido });
    
    res.status(200).json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
