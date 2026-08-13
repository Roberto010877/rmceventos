export interface EnviarContactoPayload {
  nombre: string;
  email: string;
  telefono: string;
  tipoEvento: string;
  mensaje: string;
  honeypot?: string;
  source?: string;
}

export interface EnviarContactoResponse {
  success: boolean;
  message: string;
  id?: string;
}

const TIMEOUT_MS = 30000; // 30 segundos de timeout para evitar falsos positivos

/**
 * Obtiene la URL completa del endpoint API REST.
 * 
 * OPCIÓN A (Landing en Vercel):
 *   Si la landing vive en Vercel junto a la API, utiliza '/api/contacto'.
 * 
 * OPCIÓN B (Landing en Firebase Hosting):
 *   Configurar la variable de entorno de Vite:
 *   VITE_API_URL=https://tu-proyecto.vercel.app/api/contacto
 */
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api/contacto';
  }
  throw new Error('Falta configurar VITE_API_URL con la URL publica de Vercel para enviar formularios.');
}

/**
 * Servicio aislado para enviar formularios de contacto a la API REST.
 * Maneja timeouts con AbortController y validación estricta de respuesta JSON.
 */
export async function enviarContacto(payload: EnviarContactoPayload): Promise<EnviarContactoResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const apiUrl = getApiUrl();

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: payload.nombre,
        email: payload.email,
        telefono: payload.telefono,
        tipoEvento: payload.tipoEvento,
        mensaje: payload.mensaje,
        honeypot: payload.honeypot || '',
        source: payload.source || 'landing',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Verificar si la respuesta es realmente JSON (evita interpretar index.html como respuesta exitosa)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('La respuesta del servidor no fue en formato JSON válido. Por favor verifica la URL del API (VITE_API_URL).');
    }

    const data = await response.json();

    if (!response.ok || !data.success) {
      if (response.status === 429) {
        throw new Error('Has realizado demasiados intentos. Por favor, espera unos minutos e inténtalo nuevamente.');
      }
      throw new Error(data.error || data.message || 'No se pudo procesar la solicitud. Por favor inténtalo de nuevo.');
    }

    return {
      success: true,
      message: data.message || 'Solicitud recibida correctamente',
      id: data.id,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new Error('La conexión tardó demasiado. Por favor verifica tu señal e inténtalo nuevamente.');
    }

    throw error;
  }
}
