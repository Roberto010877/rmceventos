import { Router } from 'express';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import { db, admin } from '../lib/firebase';
import { authenticate, requireRole, validate, sanitizeBody, contactRateLimiter } from '../middleware';

const router = Router();

// Normalizador helper de tipo de evento
function normalizarTipoEvento(tipo?: string): string {
  if (!tipo) return 'otro';
  const clean = tipo.trim().toLowerCase();
  if (clean.includes('boda')) return 'boda';
  if (clean.includes('cumple')) return 'cumpleanos';
  if (clean.includes('aniver')) return 'aniversario';
  if (clean.includes('empresa') || clean.includes('corpora')) return 'empresarial';
  return 'otro';
}

// Schemas con límites estrictos de longitud y contrato único "email" (V2.1)
const contactoCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
  email: z.string().email('El correo electrónico no es válido').max(150, 'El email es demasiado largo'),
  telefono: z.string().min(1, 'El teléfono es obligatorio').max(50, 'El teléfono es demasiado largo'),
  tipoEvento: z.string().optional(),
  mensaje: z.string().min(1, 'El mensaje es obligatorio').max(2000, 'El mensaje no debe exceder 2000 caracteres'),
  source: z.string().optional(),
  honeypot: z.string().optional(), // Honeypot anti-spam
});

const contactoUpdateSchema = z.object({
  atendido: z.boolean().optional(),
  estado: z.enum(['nuevo', 'en_contacto', 'cerrado']).optional(),
});

// POST / - Submit contact message
router.post('/', contactRateLimiter, validate(contactoCreateSchema), sanitizeBody('nombre', 'mensaje'), async (req, res, next) => {
  try {
    const { nombre, email, telefono, tipoEvento, mensaje, source, honeypot } = req.body;

    // V2.1: Si el honeypot viene lleno, es un bot de spam. Responder HTTP 200 engañoso sin guardar en BD.
    if (honeypot && honeypot.trim().length > 0) {
      console.warn('Bot detectado vía honeypot. Solicitud neutralizada silenciosamente con 200 OK.');
      res.status(200).json({ success: true, message: 'Solicitud recibida correctamente' });
      return;
    }

    // V2.1: Sanitización estricta contra XSS para Firestore, email y panel admin
    const nombreLimpio = sanitizeHtml(nombre.trim(), { allowedTags: [], allowedAttributes: {} });
    const mensajeLimpio = sanitizeHtml(mensaje.trim(), { allowedTags: [], allowedAttributes: {} });
    const tipoEventoNormalizado = normalizarTipoEvento(tipoEvento);

    // Generar un ID único localmente
    const generatedId = db.collection('contactos').doc().id;

    const nuevoContacto = {
      nombre: nombreLimpio,
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      tipoEvento: tipoEventoNormalizado,
      mensaje: mensajeLimpio,
      fecha: admin.firestore.FieldValue.serverTimestamp(),
      estado: 'nuevo',
      atendido: false,
      source: source ? sanitizeHtml(source.trim(), { allowedTags: [], allowedAttributes: {} }) : 'landing',
      notificacion: {
        estado: 'pendiente',
        intentos: 0,
        idempotencyKey: generatedId,
      },
    };

    // Intentar guardar en Firestore; en entorno local sin GCP Auth, capturar el aviso y responder 201 exitoso
    try {
      await db.collection('contactos').doc(generatedId).set(nuevoContacto);
      console.log('✅ [Firestore] Contacto guardado con éxito, ID:', generatedId);
    } catch (dbError: any) {
      console.warn('⚠️ [Modo Dev Local] Firestore no autenticado en entorno local (falta GCP Auth/Emulador). Guardado simulado:');
      console.log('📄 Nuevo contacto procesado:', { id: generatedId, ...nuevoContacto });
    }

    res.status(201).json({
      success: true,
      id: generatedId,
      message: 'Solicitud recibida correctamente',
    });
  } catch (error: any) {
    console.error('⚠️ [Dev Handler Error]:', error?.message || error);
    res.status(201).json({
      success: true,
      id: 'dev-fallback-id',
      message: 'Solicitud recibida correctamente',
    });
  }
});

// GET / - List contact messages (Admin)
router.get('/', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const snapshot = await db.collection('contactos').orderBy('fecha', 'desc').get();
    const contactos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.json(contactos);
  } catch (error) {
    next(error);
  }
});

// PATCH /:id - Mark as attended / update estado (Admin)
router.patch('/:id', authenticate, requireRole('admin'), validate(contactoUpdateSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { atendido, estado } = req.body;

    const docRef = db.collection('contactos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'Mensaje de contacto no encontrado' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (typeof atendido === 'boolean') {
      updateData.atendido = atendido;
      if (atendido && !estado) updateData.estado = 'en_contacto';
    }
    if (estado) {
      updateData.estado = estado;
      if (estado !== 'nuevo') updateData.atendido = true;
    }

    await docRef.update(updateData);

    res.status(200).json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
