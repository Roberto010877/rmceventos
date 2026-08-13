/**
 * RMC EVENTOS — Email Notification Trigger (V2.1)
 *
 * Trigger de Firestore v2 que envía un correo de notificación cuando
 * se crea un nuevo documento en la colección 'contactos'.
 *
 * Incluye garantía de idempotencia doble:
 * 1. Verificación de estado previo en Firestore.
 * 2. Header nativo 'idempotency-key' enviado a la API de Resend.
 */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { Resend } from 'resend';
import { admin } from '../lib/firebase';

const TIPO_EVENTO_LABELS: Record<string, string> = {
  boda: '💍 Boda',
  cumpleanos: '🎂 Cumpleaños',
  aniversario: '🥂 Aniversario',
  empresarial: '🏢 Evento Empresarial',
  otro: '✨ Otro / Consulta General',
};

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const onContactCreated = onDocumentCreated('contactos/{id}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  if (!data) return;

  // Comprobación de Idempotencia local: no reenviar si ya figura como enviada
  if (data.notificacion?.estado === 'enviada') {
    console.log(`Email para el contacto ${snapshot.id} ya fue enviado previamente. Omitiendo.`);
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY no está configurada en las variables de entorno. Notificación por correo omitida.');
    await snapshot.ref.update({
      'notificacion.estado': 'error',
      'notificacion.error': 'RESEND_API_KEY no configurada',
      'notificacion.intentos': admin.firestore.FieldValue.increment(1),
    });
    return;
  }

  const idempotencyKey = data.notificacion?.idempotencyKey || snapshot.id;
  const intentosActuales = (data.notificacion?.intentos || 0) + 1;
  const nombreRaw = asText(data.nombre, 'Cliente');
  const emailRaw = asText(data.email || data.correo, 'No especificado');
  const telefonoRaw = asText(data.telefono);
  const telefonoLimpio = telefonoRaw.replace(/\D/g, '');
  const tipoEventoClave = asText(data.tipoEvento, 'otro');
  const tipoEventoLabelRaw = TIPO_EVENTO_LABELS[tipoEventoClave] || tipoEventoClave || 'Consulta General';
  const mensajeHtml = escapeHtml(asText(data.mensaje)).replace(/\n/g, '<br>');
  const source = escapeHtml(asText(data.source, 'landing'));
  const nombre = escapeHtml(nombreRaw);
  const email = escapeHtml(emailRaw);
  const emailHref = escapeHtml(emailRaw.replace(/[\r\n]/g, ''));
  const telefono = escapeHtml(telefonoRaw);
  const tipoEventoLabel = escapeHtml(tipoEventoLabelRaw);

  const whatsappUrl = telefonoLimpio
    ? `https://wa.me/${telefonoLimpio.startsWith('591') ? telefonoLimpio : '591' + telefonoLimpio}?text=Hola%20${encodeURIComponent(nombreRaw)},%20te%20contactamos%20desde%20RMC%20Eventos`
    : null;

  try {
    const resend = new Resend(apiKey);
    const recipientEmail = process.env.NOTIFICATION_EMAIL || 'rmc.eventos2631@gmail.com';

    // V2.1: Pasar headers con idempotency-key nativa para evitar duplicados en la API de email
    await resend.emails.send({
      from: 'RMC Eventos <no-reply@rmceventos.com>',
      to: recipientEmail,
      subject: `🎉 Nuevo pedido de cotización — ${nombre} (${tipoEventoLabel})`,
      headers: {
        'idempotency-key': idempotencyKey,
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5ef; margin: 0; padding: 20px; color: #171717; }
            .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e7e2d8; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background-color: #171717; padding: 24px; text-align: center; border-bottom: 3px solid #d4af37; }
            .header h1 { color: #d4af37; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px; }
            .content { padding: 28px; }
            .badge { display: inline-block; background-color: #f7f5ef; color: #ad8b20; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 16px; }
            .field-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
            .field-table td { padding: 10px 0; border-bottom: 1px solid #f0eee8; font-size: 14px; }
            .field-label { font-weight: bold; color: #706c64; width: 130px; }
            .field-value { color: #171717; font-weight: 500; }
            .message-box { background-color: #fbfaf7; border-left: 4px solid #d4af37; padding: 16px; border-radius: 8px; margin: 20px 0; font-size: 14px; line-height: 1.5; color: #333333; }
            .actions { display: flex; gap: 12px; margin-top: 24px; text-align: center; }
            .btn { display: inline-block; flex: 1; padding: 12px 20px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 13px; text-align: center; }
            .btn-ws { background-color: #25d366; color: #ffffff; }
            .btn-email { background-color: #171717; color: #ffffff; }
            .footer { background-color: #fbfaf7; padding: 16px; text-align: center; font-size: 11px; color: #888888; border-top: 1px solid #f0eee8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>🎉 RMC EVENTOS</h1>
            </div>
            <div class="content">
              <span class="badge">NUEVA SOLICITUD DE COTIZACIÓN</span>
              <p style="font-size: 15px; margin-top: 0; color: #4d4941;">
                Se ha recibido una nueva solicitud desde el sitio web (Origen: <strong>${source}</strong>):
              </p>
              
              <table class="field-table">
                <tr>
                  <td class="field-label">Cliente:</td>
                  <td class="field-value">${nombre}</td>
                </tr>
                <tr>
                  <td class="field-label">Tipo de Evento:</td>
                  <td class="field-value">${tipoEventoLabel}</td>
                </tr>
                <tr>
                  <td class="field-label">Teléfono:</td>
                  <td class="field-value">${telefono}</td>
                </tr>
                <tr>
                  <td class="field-label">Correo:</td>
                  <td class="field-value"><a href="mailto:${emailHref}" style="color: #ad8b20;">${email}</a></td>
                </tr>
              </table>

              <div class="message-box">
                <strong style="display: block; color: #171717; margin-bottom: 6px;">Mensaje del cliente:</strong>
                ${mensajeHtml}
              </div>

              <div class="actions">
                ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" class="btn btn-ws">📲 Responder por WhatsApp</a>` : ''}
                <a href="mailto:${email}?subject=Re:%20Cotización%20RMC%20Eventos%20-${encodeURIComponent(tipoEventoLabel)}" class="btn btn-email">✉️ Responder por Correo</a>
              </div>
            </div>
            <div class="footer">
              Ecosistema Web RMC Eventos · ID Contacto: ${snapshot.id}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Actualizar Firestore indicando éxito y registrando la idempotency key
    await snapshot.ref.update({
      'notificacion.estado': 'enviada',
      'notificacion.enviadoAt': admin.firestore.FieldValue.serverTimestamp(),
      'notificacion.intentos': intentosActuales,
      'notificacion.idempotencyKey': idempotencyKey,
      'notificacion.error': admin.firestore.FieldValue.delete(),
    });

    console.log(`Correo de notificación comercial enviado exitosamente (Idempotency Key: ${idempotencyKey})`);
  } catch (error: any) {
    console.error('Error al enviar correo de notificación vía Resend:', error);
    await snapshot.ref.update({
      'notificacion.estado': 'error',
      'notificacion.error': error?.message || 'Error desconocido al enviar email',
      'notificacion.intentos': intentosActuales,
    });
  }
});
