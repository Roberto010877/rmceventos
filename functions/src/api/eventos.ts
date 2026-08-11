import { Router } from 'express';
import { z } from 'zod';
import { db } from '../lib/firebase';
import { logAudit } from '../lib/audit';
import { authenticate, requireRole, validate, sanitizeBody } from '../middleware';

const router = Router();

// Schemas
const eventoCreateSchema = z.object({
  nombre: z.string().min(1),
  tipoEvento: z.enum(['boda', 'aniversario', 'corporativo', 'cumpleanos', 'otro']),
  fecha: z.string().datetime(),
  clienteNombre: z.string().optional(),
  descripcion: z.string().optional(),
});

const eventoUpdateSchema = eventoCreateSchema.partial();

// GET / - List all events
router.get('/', authenticate, requireRole('editor'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('eventos').orderBy('fecha', 'desc').get();
    const eventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(eventos);
  } catch (error) {
    next(error);
  }
});

// POST / - Create event
router.post('/', authenticate, requireRole('admin'), validate(eventoCreateSchema), sanitizeBody('nombre', 'clienteNombre', 'descripcion'), async (req, res, next) => {
  try {
    const body = req.body;
    const userId = (req as any).user!.uid;
    const userEmail = (req as any).user!.email || 'unknown';
    
    const nuevoEvento = {
      ...body,
      fecha: new Date(body.fecha),
      creadoEn: new Date()
    };
    
    const docRef = await db.collection('eventos').add(nuevoEvento);
    
    await logAudit(userId, userEmail, 'evento.crear', docRef.id, `Nombre: ${body.nombre}`);
    
    res.status(201).json({ id: docRef.id, ...nuevoEvento });
  } catch (error) {
    next(error);
  }
});

// PATCH / - Update event
router.patch('/:id', authenticate, requireRole('admin'), validate(eventoUpdateSchema), sanitizeBody('nombre', 'clienteNombre', 'descripcion'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const body = req.body;
    const userId = (req as any).user!.uid;
    const userEmail = (req as any).user!.email || 'unknown';
    
    const docRef = db.collection('eventos').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Evento no encontrado' });
      return;
    }
    
    const updateData = { ...body };
    if (body.fecha) {
      updateData.fecha = new Date(body.fecha);
    }
    
    await docRef.update(updateData);
    
    await logAudit(userId, userEmail, 'evento.editar', id, `Cambios: ${JSON.stringify(body)}`);
    
    res.status(200).json({ message: 'Evento actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

// DELETE /:id - Delete event
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user!.uid;
    const userEmail = (req as any).user!.email || 'unknown';
    
    const docRef = db.collection('eventos').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Evento no encontrado' });
      return;
    }
    
    await docRef.delete();
    
    await logAudit(userId, userEmail, 'evento.eliminar', id);
    
    res.status(200).json({ message: 'Evento eliminado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
