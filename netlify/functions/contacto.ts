import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import sanitizeHtml from 'sanitize-html';
import * as admin from 'firebase-admin';
import { Resend } from 'resend';

/**
 * RMC EVENTOS — Netlify Serverless Function para Formulario de Contacto (V5 - Resend Onboarding Fix)
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

// ── Rate Limiter por IP (5 peticiones por minuto) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) return false;
  record.count += 1;
  return true;
}

// ── Limpiador y Normalizador de Clave Privada PEM de RSA ──
function cleanPrivateKey(rawKey: string): string {
  let key = rawKey.trim();
  
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.substring(1, key.length - 1);
  }

  key = key.replace(/\r\n/g, '\n');

  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  key = key.replace(/\n+/g, '\n');

  return key;
}

// ── Inicialización Singleton de Firebase Admin SDK ──
function getFirebaseAdmin() {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT || 'rmc-eventos-bo';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKeyRaw) {
      throw new Error(
        'CONFIGURACIÓN INCOMPLETA: Faltan las variables FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.'
      );
    }

    const privateKey = cleanPrivateKey(privateKeyRaw);

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

const contactoCreateSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre es demasiado largo'),
  email: z.string().email('El correo electrónico no es válido').max(150, 'El email es demasiado largo'),
  telefono: z.string().min(1, 'El teléfono es obligatorio').max(50, 'El teléfono es demasiado largo'),
  tipoEvento: z.string().optional(),
  mensaje: z.string().min(1, 'El mensaje es obligatorio').max(2000, 'El mensaje no debe exceder 2000 caracteres'),
  source: z.string().optional(),
  honeypot: z.string().optional(),
});

export const handler: Handler = async (event) => {
  const requestOrigin = event.headers.origin || event.headers.Origin || event.headers.ORIGIN;
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Content-Type': 'application/json',
  };

  if (requestOrigin) {
    if (ALLOWED_ORIGINS.includes(requestOrigin)) {
      headers['Access-Control-Allow-Origin'] = requestOrigin;
      headers['Access-Control-Allow-Credentials'] = 'true';
    } else {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: `Origen ${requestOrigin} no permitido por política CORS.` }),
      };
    }
  } else {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Método no permitido. Usa POST.' }) };
  }

  const clientIp = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return { statusCode: 429, headers, body: JSON.stringify({ error: 'Has realizado demasiados intentos.' }) };
  }

  try {
    const bodyData = event.body ? JSON.parse(event.body) : {};
    const parseResult = contactoCreateSchema.safeParse(bodyData);

    if (!parseResult.success) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Datos no válidos',
          details: parseResult.error.errors.map(e => e.message),
        }),
      };
    }

    const { nombre, email, telefono, tipoEvento, mensaje, source, honeypot } = parseResult.data;

    if (honeypot && honeypot.trim().length > 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, message: 'Solicitud recibida' }) };
    }

    const nombreLimpio = sanitizeHtml(nombre.trim(), { allowedTags: [], allowedAttributes: {} });
    const mensajeLimpio = sanitizeHtml(mensaje.trim(), { allowedTags: [], allowedAttributes: {} });
    const tipoEventoNormalizado = normalizarTipoEvento(tipoEvento);

    let adminSdk: typeof admin;
    try {
      adminSdk = getFirebaseAdmin();
    } catch (configErr: any) {
      console.error('❌ Config Error Firebase Admin:', configErr?.message);
      return { statusCode: 500, headers, body: JSON.stringify({ error: `Error de configuración: ${configErr?.message}` }) };
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
      notificacion: { estado: 'pendiente', intentos: 1, idempotencyKey: generatedId },
    };

    const currentClientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'NO_SET';
    const currentProjectId = process.env.FIREBASE_PROJECT_ID || 'rmc-eventos-bo';

    try {
      await db.collection('contactos').doc(generatedId).set(nuevoContacto);
      console.log('✅ [Firestore Netlify Success]: Documento creado con ID:', generatedId);
    } catch (dbErr: any) {
      console.error('❌ [Firestore Error]:', dbErr?.message || dbErr);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: `Error Auth Firestore (Project: ${currentProjectId}, Account: ${currentClientEmail}): ${dbErr?.message || 'Fallo de autenticación'}`,
        }),
      };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const recipientEmail = process.env.NOTIFICATION_EMAIL || 'rmc.eventos2631@gmail.com';
        const senderEmail = process.env.RESEND_FROM_EMAIL || 'RMC Eventos <onboarding@resend.dev>';
        const tipoEventoLabel = TIPO_EVENTO_LABELS[tipoEventoNormalizado] || 'Consulta General';
        const telefonoLimpio = telefono.trim().replace(/\D/g, '');
        const whatsappUrl = telefonoLimpio
          ? `https://wa.me/${telefonoLimpio.startsWith('591') ? telefonoLimpio : '591' + telefonoLimpio}?text=Hola%20${encodeURIComponent(nombreLimpio)},%20te%20contactamos%20desde%20RMC%20Eventos`
          : null;
        const mensajeHtml = escapeHtml(mensajeLimpio).replace(/\n/g, '<br>');

        console.log(`📧 [Resend] Enviando correo desde '${senderEmail}' a '${recipientEmail}'...`);

        const resendResult = await resend.emails.send({
          from: senderEmail,
          to: recipientEmail,
          subject: `🎉 Nuevo pedido de cotización — ${escapeHtml(nombreLimpio)} (${tipoEventoLabel})`,
          headers: { 'idempotency-key': generatedId },
          html: `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: sans-serif; background-color: #f7f5ef; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e7e2d8;">
                <h2 style="color: #d4af37; background: #171717; padding: 16px; text-align: center; margin: -24px -24px 20px -24px; border-radius: 16px 16px 0 0;">🎉 RMC EVENTOS</h2>
                <p>NUEVO CONTACTO RECIBIDO:</p>
                <ul>
                  <li><strong>Cliente:</strong> ${escapeHtml(nombreLimpio)}</li>
                  <li><strong>Correo:</strong> ${escapeHtml(email.trim())}</li>
                  <li><strong>Teléfono:</strong> ${escapeHtml(telefono.trim())}</li>
                  <li><strong>Tipo de Evento:</strong> ${tipoEventoLabel}</li>
                </ul>
                <div style="background: #fbfaf7; border-left: 4px solid #d4af37; padding: 12px; margin: 16px 0;">
                  ${mensajeHtml}
                </div>
                ${whatsappUrl ? `<p><a href="${whatsappUrl}" style="background: #25d366; color: #fff; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-weight: bold;">📲 Responder por WhatsApp</a></p>` : ''}
              </div>
            </body>
            </html>
          `,
        });

        if (resendResult.error) {
          console.error('❌ Resend API Error:', resendResult.error);
          await db.collection('contactos').doc(generatedId).update({
            'notificacion.estado': 'error',
            'notificacion.error': resendResult.error.message || JSON.stringify(resendResult.error),
          }).catch(() => {});
        } else {
          console.log('✅ Resend Email Enviado Exitosamente:', resendResult.data);
          await db.collection('contactos').doc(generatedId).update({
            'notificacion.estado': 'enviada',
            'notificacion.enviadoAt': adminSdk.firestore.FieldValue.serverTimestamp(),
          }).catch(() => {});
        }
      } catch (emailErr: any) {
        console.error('❌ Exception en envío Resend:', emailErr?.message || emailErr);
        await db.collection('contactos').doc(generatedId).update({
          'notificacion.estado': 'error',
          'notificacion.error': emailErr?.message || 'Error en Resend',
        }).catch(() => {});
      }
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ success: true, id: generatedId, message: 'Solicitud recibida correctamente' }),
    };
  } catch (error: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: `Error interno: ${error?.message || error}` }) };
  }
};
