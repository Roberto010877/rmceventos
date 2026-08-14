import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

/**
 * RMC EVENTOS — Vercel Serverless Function para Formulario de Contacto (V3 - Final Producción)
 *
 * Mejoras aplicadas:
 * 1. CORS Estricto: Rechaza con HTTP 403 si la petición viene de un Origen no autorizado.
 * 2. Rate Limiting por IP: Máximo 5 peticiones por minuto por IP para evitar spam directo al endpoint.
 * 3. Notificación de error en Firestore: Si Resend falla, marca 'notificacion.estado' = 'error' en el Admin.
 * 4. Trazabilidad completa y Fail-Fast en credenciales.
 */

// ── Lista de Orígenes Permitidos para CORS ──
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://rmc-eventos-bo.web.app',
  'https://rmc-eventos-bo.firebaseapp.com',
  'https://rmc-eventos-admin.web.app',
  'https://rmceventos.com',
  'https://www.rmceventos.com',
  'https://admin.rmceventos.com',
];

// ── Rate Limiter en Memoria por IP (5 peticiones por minuto) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

// ── Inicialización Singleton de Firebase Admin SDK ──
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || 'rmc-eventos-bo';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKeyRaw) {
      throw new Error(
        'CONFIGURACIÓN INCOMPLETA: Se requieren las variables de entorno FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en Vercel para conectarse a Firestore.'
      );
    }

    const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
  return admin;
}

// ── Normalizador de Tipo de Evento ──
const TIPO_EVENTO_LABELS: Record<string, string> = {
  boda: '💍 Boda',
  cumpleanos: '🎂 Cumpleaños',
  aniversario: '🥂 Aniversario',
  empresarial: '🏢 Evento Empresarial',
  otro: '✨ Otro / Consulta General',
};

function normalizarTipoEvento(tipo?: string): string {
  if (!tipo) return 'otro';
  const clean = tipo.trim().toLowerCase();
  if (clean.includes('boda')) return 'boda';
  if (clean.includes('cumple')) return 'cumpleanos';
  if (clean.includes('aniver')) return 'aniversario';
  if (clean.includes('empresa') || clean.includes('corpora')) return 'empresarial';
  return 'otro';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Schema de Validación Zod ──
const contactoCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
  email: z.string().email('El correo electrónico no es válido').max(150, 'El email es demasiado largo'),
  telefono: z.string().min(1, 'El teléfono es obligatorio').max(50, 'El teléfono es demasiado largo'),
  tipoEvento: z.string().optional(),
  mensaje: z.string().min(1, 'El mensaje es obligatorio').max(2000, 'El mensaje no debe exceder 2000 caracteres'),
  source: z.string().optional(),
  honeypot: z.string().optional(),
});

// ── Handler Principal de Vercel ──
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestOrigin = req.headers.origin as string | undefined;

  // 1. CORS Estricto: Si viene header Origin y no está en la lista permitida, responder 403 Forbidden
  if (requestOrigin) {
    if (ALLOWED_ORIGINS.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      console.warn(`⛔ [CORS Bloqueado]: Petición proveniente de origen no autorizado: ${requestOrigin}`);
      res.status(403).json({ error: `Origen ${requestOrigin} no permitido por política CORS.` });
      return;
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido. Utiliza POST.' });
    return;
  }

  // 2. Rate Limiting por IP
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIp)) {
    console.warn(`⚠️ [Rate Limit Excedido]: IP ${clientIp} superó 5 peticiones por minuto.`);
    res.status(429).json({ error: 'Has realizado demasiados intentos. Por favor, espera un minuto e inténtalo de nuevo.' });
    return;
  }

  try {
    // 3. Validar cuerpo de la petición con Zod
    const parseResult = contactoCreateSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Datos de formulario no válidos',
        details: parseResult.error.errors.map(e => e.message),
      });
      return;
    }

    const { nombre, email, telefono, tipoEvento, mensaje, source, honeypot } = parseResult.data;

    // 4. Honeypot Anti-Spam: Si un bot llenó el campo trampa, neutralizar silenciosamente
    if (honeypot && honeypot.trim().length > 0) {
      console.warn('Bot detectado vía honeypot. Solicitud neutralizada silenciosamente.');
      res.status(200).json({ success: true, message: 'Solicitud recibida correctamente' });
      return;
    }

    // 5. Sanitización de HTML contra XSS
    const nombreLimpio = sanitizeHtml(nombre.trim(), { allowedTags: [], allowedAttributes: {} });
    const mensajeLimpio = sanitizeHtml(mensaje.trim(), { allowedTags: [], allowedAttributes: {} });
    const tipoEventoNormalizado = normalizarTipoEvento(tipoEvento);

    // 6. Inicializar Firebase Admin SDK
    let adminSdk: typeof admin;
    try {
      adminSdk = getFirebaseAdmin();
    } catch (configErr: any) {
      console.error('❌ Error de configuración de Firebase Admin en Vercel:', configErr.message);
      res.status(500).json({
        error: 'Error de configuración del servidor. Por favor contacta al administrador.',
      });
      return;
    }

    const db = adminSdk.firestore();
    const generatedId = db.collection('contactos').doc().id;

    const nuevoContacto = {
      nombre: nombreLimpio,
      email: email.trim().toLowerCase(),
      telefono: telefono.trim(),
      tipoEvento: tipoEventoNormalizado,
      mensaje: mensajeLimpio,
      fecha: adminSdk.firestore.FieldValue.serverTimestamp(),
      estado: 'nuevo',
      atendido: false,
      source: source ? sanitizeHtml(source.trim(), { allowedTags: [], allowedAttributes: {} }) : 'landing',
      notificacion: {
        estado: 'pendiente',
        intentos: 1,
        idempotencyKey: generatedId,
      },
    };

    // 7. Guardar en Firestore OBLIGATORIAMENTE
    try {
      await db.collection('contactos').doc(generatedId).set(nuevoContacto);
      console.log('✅ [Firestore] Contacto guardado con éxito desde Vercel Function, ID:', generatedId);
    } catch (dbErr: any) {
      console.error('❌ [Firestore Critical Error]: No se pudo escribir el contacto en Firestore:', dbErr?.message || dbErr);
      res.status(500).json({
        error: 'No se pudo guardar la solicitud en la base de datos. Por favor inténtalo de nuevo.',
      });
      return;
    }

    // 8. Envío de Notificación por Correo con Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const recipientEmail = process.env.NOTIFICATION_EMAIL || 'rmc.eventos2631@gmail.com';
        const tipoEventoLabel = TIPO_EVENTO_LABELS[tipoEventoNormalizado] || 'Consulta General';
        const telefonoLimpio = telefono.trim().replace(/\D/g, '');
        const whatsappUrl = telefonoLimpio
          ? `https://wa.me/${telefonoLimpio.startsWith('591') ? telefonoLimpio : '591' + telefonoLimpio}?text=Hola%20${encodeURIComponent(nombreLimpio)},%20te%20contactamos%20desde%20RMC%20Eventos`
          : null;
        const mensajeHtml = escapeHtml(mensajeLimpio).replace(/\n/g, '<br>');

        const senderEmail = process.env.RESEND_FROM_EMAIL || 'RMC Eventos <onboarding@resend.dev>';
        await resend.emails.send({
          from: senderEmail,
          to: recipientEmail,
          subject: `🎉 Nuevo pedido de cotización — ${escapeHtml(nombreLimpio)} (${tipoEventoLabel})`,
          headers: { 'idempotency-key': generatedId },
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f7f5ef; margin: 0; padding: 20px; color: #171717;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e7e2d8; overflow: hidden;">
                <div style="background-color: #171717; padding: 24px; text-align: center; border-bottom: 3px solid #d4af37;">
                  <h1 style="color: #d4af37; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">🎉 RMC EVENTOS</h1>
                </div>
                <div style="padding: 28px;">
                  <span style="display: inline-block; background-color: #f7f5ef; color: #ad8b20; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px;">NUEVA SOLICITUD DE COTIZACIÓN</span>
                  <p style="font-size: 15px; margin-top: 0; color: #4d4941;">Se ha recibido un nuevo contacto desde el sitio web:</p>
                  
                  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #706c64; width: 130px;">Cliente:</td>
                      <td style="padding: 8px 0; color: #171717; font-weight: 500;">${escapeHtml(nombreLimpio)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #706c64;">Tipo de Evento:</td>
                      <td style="padding: 8px 0; color: #171717; font-weight: 500;">${tipoEventoLabel}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #706c64;">Teléfono:</td>
                      <td style="padding: 8px 0; color: #171717; font-weight: 500;">${escapeHtml(telefono.trim())}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold; color: #706c64;">Correo:</td>
                      <td style="padding: 8px 0; color: #ad8b20;"><a href="mailto:${escapeHtml(email.trim())}" style="color: #ad8b20;">${escapeHtml(email.trim())}</a></td>
                    </tr>
                  </table>

                  <div style="background-color: #fbfaf7; border-left: 4px solid #d4af37; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; line-height: 1.5; color: #333333;">
                    <strong style="display: block; color: #171717; margin-bottom: 6px;">Mensaje del cliente:</strong>
                    ${mensajeHtml}
                  </div>

                  <div style="margin-top: 24px; text-align: center;">
                    ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" style="display: inline-block; padding: 12px 20px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 13px; background-color: #25d366; color: #ffffff; margin-right: 8px;">📲 Responder por WhatsApp</a>` : ''}
                    <a href="mailto:${escapeHtml(email.trim())}" style="display: inline-block; padding: 12px 20px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 13px; background-color: #171717; color: #ffffff;">✉️ Responder por Correo</a>
                  </div>
                </div>
                <div style="background-color: #fbfaf7; padding: 16px; text-align: center; font-size: 11px; color: #888888; border-top: 1px solid #f0eee8;">
                  Ecosistema Web RMC Eventos · ID Contacto: ${generatedId}
                </div>
              </div>
            </body>
            </html>
          `,
        });

        // Actualizar Firestore registrando que la notificación fue enviada
        await db.collection('contactos').doc(generatedId).update({
          'notificacion.estado': 'enviada',
          'notificacion.enviadoAt': adminSdk.firestore.FieldValue.serverTimestamp(),
        }).catch(() => {});
      } catch (emailErr: any) {
        console.error('❌ Error enviando email con Resend:', emailErr?.message || emailErr);
        // Registrar el error de envío de email en el documento de Firestore para visibilidad en el Panel Admin
        await db.collection('contactos').doc(generatedId).update({
          'notificacion.estado': 'error',
          'notificacion.error': emailErr?.message || 'Error desconocido al enviar correo vía Resend',
        }).catch(() => {});
      }
    }

    res.status(201).json({
      success: true,
      id: generatedId,
      message: 'Solicitud recibida correctamente',
    });
  } catch (error: any) {
    console.error('❌ Error general en Vercel Function:', error?.message || error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}
