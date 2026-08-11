import { Router } from 'express';
import { z } from 'zod';
import { db, storage } from '../lib/firebase';
import { logAudit } from '../lib/audit';
import { authenticate, requireRole, validate, sanitizeBody } from '../middleware';

const router = Router();

// Schemas
const fotoQuerySchema = z.object({
  categoria: z.string().optional(),
  eventoId: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
});

const fotoCreateSchema = z.object({
  url: z.string().url(),
  categoria: z.enum(['decoracion', 'mobiliario', 'banqueteria']),
  eventoId: z.string().optional(),
  descripcion: z.string().max(500).optional(),
  destacada: z.boolean().optional().default(false),
});

const fotoOrdenSchema = z.object({
  orden: z.number().min(0),
});

// GET / - List all photos
router.get('/', authenticate, requireRole('editor'), async (req, res, next) => {
  try {
    const { categoria, eventoId, limit, offset } = fotoQuerySchema.parse(req.query);
    
    let query = db.collection('fotos').orderBy('fechaSubida', 'desc');
    
    if (categoria) {
      query = query.where('categoria', '==', categoria);
    }
    if (eventoId) {
      query = query.where('eventoId', '==', eventoId);
    }
    
    query = query.limit(limit).offset(offset);
    
    const snapshot = await query.get();
    const fotos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    res.json(fotos);
  } catch (error) {
    next(error);
  }
});

// POST / - Upload photo metadata
router.post('/', authenticate, requireRole('editor'), validate(fotoCreateSchema), sanitizeBody('descripcion'), async (req, res, next) => {
  try {
    const body = req.body;
    const userId = (req as any).user!.uid;
    
    // Obtener el orden actual (el máximo actual + 1)
    const ordenSnapshot = await db.collection('fotos').orderBy('orden', 'desc').limit(1).get();
    let orden = 0;
    if (!ordenSnapshot.empty) {
      orden = (ordenSnapshot.docs[0].data().orden || 0) + 1;
    }
    
    const nuevaFoto = {
      ...body,
      subidoPor: userId,
      fechaSubida: new Date(),
      estadoProcesamiento: 'procesando',
      orden
    };
    
    const docRef = await db.collection('fotos').add(nuevaFoto);
    const userEmail = (req as any).user!.email || 'unknown';
    
    await logAudit(userId, userEmail, 'foto.crear', docRef.id, `URL: ${body.url}`);
    
    res.status(201).json({ id: docRef.id, ...nuevaFoto });
  } catch (error) {
    next(error);
  }
});

// DELETE /:id - Delete photo
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const userId = (req as any).user!.uid;
    const userEmail = (req as any).user!.email || 'unknown';
    
    const docRef = db.collection('fotos').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Foto no encontrada' });
      return;
    }
    
    const data = doc.data();
    
    // Función auxiliar para extraer ruta del Storage desde URL de Firebase
    const deleteFromStorage = async (url: string) => {
      if (!url) return;
      try {
        // Asumiendo formato GS url o URL de descarga para parsear
        // Por simplificación, asume que urlWebp, url, urlThumbnail almacenan el path de Firebase Storage.
        // Si almacenan el path relativo, podemos usar bucket.file().delete()
        // Aquí requerimos la ruta del archivo.
        const decodedUrl = decodeURIComponent(url);
        const match = decodedUrl.match(/\/o\/([^?]+)/);
        if (match && match[1]) {
          const filePath = match[1];
          await storage.bucket().file(filePath).delete();
        }
      } catch (e) {
        console.error('Error al borrar archivo de Storage:', e);
      }
    };
    
    await deleteFromStorage(data?.url);
    await deleteFromStorage(data?.urlWebp);
    await deleteFromStorage(data?.urlThumbnail);
    
    await docRef.delete();
    
    await logAudit(userId, userEmail, 'foto.eliminar', id);
    
    res.status(200).json({ message: 'Foto eliminada correctamente' });
  } catch (error) {
    next(error);
  }
});

// PATCH /:id/orden - Update photo order
router.patch('/:id/orden', authenticate, requireRole('editor'), validate(fotoOrdenSchema), async (req, res, next) => {
  try {
    const id = req.params.id as string;
    const { orden } = req.body;
    
    const docRef = db.collection('fotos').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      res.status(404).json({ error: 'Foto no encontrada' });
      return;
    }
    
    await docRef.update({ orden });
    
    res.status(200).json({ message: 'Orden actualizado correctamente' });
  } catch (error) {
    next(error);
  }
});

export default router;
