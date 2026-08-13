# 🎉 RMC EVENTOS

> Ecosistema web para **RMC EVENTOS** — organización de eventos en Santa Cruz, Bolivia.

## 📦 Estructura del Monorepo

```
rmc-eventos/
├── landing/        → Sitio público (React + Vite + Tailwind)
├── admin/          → Panel de administración PWA (React + Vite + Tailwind)
├── functions/      → Cloud Functions (Express + TypeScript)
├── shared/         → Tipos TypeScript compartidos
├── firestore.rules → Reglas de seguridad de Firestore
├── storage.rules   → Reglas de seguridad de Storage
└── firebase.json   → Configuración de Firebase
```

## 🚀 Setup rápido

### Prerrequisitos
- Node.js ≥ 22
- npm ≥ 10
- Java 21+ (para emuladores Firebase con Firebase CLI actual)
- Firebase CLI (`npm install -g firebase-tools` o `npx firebase-tools`)

### Instalación

```bash
# Clonar el repositorio
cd rmc-eventos

# Instalar dependencias de Cloud Functions
cd functions && npm install && cd ..

# Instalar dependencias de la landing
cd landing && npm install && cd ..

# Instalar dependencias del admin
cd admin && npm install && cd ..
```

### Variables de entorno

Copiar `.env.example` y configurar las variables:

```bash
# Para landing y admin
cp .env.example landing/.env.local
cp .env.example admin/.env.local

# Para Cloud Functions
cp functions/.env.example functions/.env
```

Variables criticas para Functions:

- `RESEND_API_KEY`: API key de Resend para enviar notificaciones de contacto.
- `NOTIFICATION_EMAIL`: correo destino de las solicitudes.

### Desarrollo local con emuladores

```bash
# Iniciar emuladores Firebase
npx firebase-tools emulators:start

# En otra terminal: iniciar el proyecto que estés trabajando
cd landing && npm run dev   # Puerto 5173
cd admin && npm run dev     # Puerto 5174
```

### Emulators UI
Abre `http://localhost:4000` para ver los emuladores de Firebase.

## 🏗️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Lenguaje | TypeScript |
| Landing | React + Vite + Tailwind CSS |
| Admin | React + Vite + Tailwind CSS (PWA) |
| API | Express sobre Cloud Functions |
| Validación | Zod + sanitize-html |
| Base de datos | Cloud Firestore |
| Storage | Firebase Cloud Storage |
| Autenticación | Firebase Auth + Custom Claims |
| Email | Resend |
| Hosting | Firebase Hosting (multi-site) |

## 🔒 Seguridad

- **Lectura pública**: fotos procesadas, servicios, testimonios aprobados (directo desde Firestore SDK)
- **Escritura**: toda escritura pasa por la API REST con verificación de rol
- **Roles**: editor → admin → superadmin (Custom Claims)
- **Protecciones**: App Check, reCAPTCHA, rate limiting, sanitización

## 📍 Información del negocio

- **Ubicación**: Santa Cruz, Bolivia
- **Email**: rmc.eventos2631@gmail.com
- **WhatsApp**: +591 72601952

## 🔗 URLs

| Sitio | URL |
|---|---|
| Landing (producción) | `https://rmc-eventos-bo.web.app` |
| Admin (producción) | `https://rmc-eventos-admin.web.app` |
| API Health | `https://[region]-rmc-eventos-bo.cloudfunctions.net/api/api/v1/health` |

> Cuando se tenga el dominio `rmceventos.com`, se conectará vía Firebase Hosting.

## 📋 Firebase Project

- **Project ID**: `rmc-eventos-bo`
- **Consola**: https://console.firebase.google.com/project/rmc-eventos-bo/overview

## Salida a produccion

Checklist minimo antes de publicar:

```bash
cd landing && npm run build
cd ../admin && npm run build
cd ../functions && npm run build
cd ..
npx firebase-tools deploy --only firestore:rules,functions,hosting
```

Despues del deploy:

- Probar `https://rmceventos.com/robots.txt`.
- Probar `https://rmceventos.com/sitemap.xml`.
- Probar envio del formulario de contacto.
- Probar carga de imagen hero desde el panel admin.
- Registrar el dominio en Google Search Console y enviar el sitemap.
