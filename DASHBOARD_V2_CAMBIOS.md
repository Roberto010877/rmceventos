# Dashboard V2 - Cambios realizados

Fecha: 2026-08-12

## Resumen

Se implemento una evolucion modular del dashboard administrativo de RMC Eventos. El objetivo fue separar la logica de datos de la interfaz, evitar consultas no autorizadas segun rol y mejorar la lectura operativa del panel sin rehacer la arquitectura base.

No se modifico la configuracion Firebase client.

## Decision de permisos

Se respeto la seguridad definida en `firestore.rules`:

- `editor`: Dashboard, Fotos y Eventos.
- `admin`: Dashboard, Fotos, Eventos, Contactos, Testimonios, Servicios y Configuracion.
- `superadmin`: todo lo anterior mas Usuarios y Auditoria.

Por eso `Contactos` y `Testimonios` dejaron de estar visibles para `editor` en la navegacion, y tambien quedaron protegidos por ruta.

## Archivos creados

### Tipos

- `admin/src/types/dashboard.ts`
  - Define roles, permisos, estadisticas, contactos, testimonios, eventos, fotos, actividad y estructura completa del dashboard.

### Servicios

- `admin/src/services/dashboardService.ts`
  - Centraliza las consultas Firestore del dashboard.
  - Usa `getCountFromServer()` para contadores principales.
  - Usa listeners en tiempo real solo para pendientes accionables:
    - contactos sin atender;
    - testimonios pendientes.
  - Usa consultas limitadas para listas recientes:
    - eventos recientes;
    - fotos recientes;
    - auditoria reciente solo para `superadmin`.
  - Evita consultar colecciones que el rol actual no puede leer.

### Hook

- `admin/src/hooks/useDashboardData.ts`
  - Une permisos, contadores y listeners.
  - Entrega `data`, `permissions`, `loading` y `error` a la pagina.
  - Limpia suscripciones al desmontar el dashboard.

### Componentes

Carpeta creada: `admin/src/components/dashboard/`

- `DashboardHeader.tsx`
- `DashboardStats.tsx`
- `StatCard.tsx`
- `PriorityPanel.tsx`
- `RecentContacts.tsx`
- `RecentEvents.tsx`
- `PhotoOverview.tsx`
- `RecentActivity.tsx`
- `QuickActions.tsx`
- `SystemStatus.tsx`
- `format.ts`

## Archivos modificados

### `admin/src/pages/DashboardPage.tsx`

Se reemplazo el dashboard monolitico por una composicion de componentes:

- encabezado operativo;
- estado de sincronizacion;
- KPIs;
- prioridades;
- eventos recientes;
- fotos recientes;
- contactos pendientes solo si el rol puede leerlos;
- actividad reciente solo para `superadmin`;
- acciones rapidas filtradas por permisos.

La pagina ya no contiene consultas Firestore directas.

### `admin/src/components/AdminLayout.tsx`

Se ajusto la navegacion:

- `Testimonios`: ahora solo `admin` y `superadmin`.
- `Contactos`: ahora solo `admin` y `superadmin`.

Esto alinea el menu con `firestore.rules`.

### `admin/src/App.tsx`

Se protegieron rutas manuales:

- `/testimonios`: requiere `admin` o `superadmin`.
- `/contactos`: requiere `admin` o `superadmin`.

Esto evita que un `editor` entre por URL directa a una pantalla que Firestore no le permite consultar.

## Consultas Firestore

### Contadores

Se cambio el enfoque de contar con snapshots completos a contadores por agregacion:

- `fotos`
- `eventos`
- `contactos` sin atender, solo para admin/superadmin
- `testimonios` pendientes, solo para admin/superadmin

### Tiempo real

Se mantiene tiempo real para datos accionables:

- contactos pendientes;
- testimonios pendientes.

### Listas limitadas

Se usan limites para no descargar colecciones completas:

- ultimos 5 eventos;
- ultimas 6 fotos;
- ultimas 5 actividades de auditoria, solo superadmin.

## Verificacion

Comandos ejecutados desde `admin/`:

```bash
npm run build
npm run lint
```

Resultado:

- `npm run build`: correcto.
- `npm run lint`: correcto, con una advertencia existente en `src/context/AuthContext.tsx` sobre Fast Refresh porque el archivo exporta `useAuth` ademas del componente/provider.

## Nota sobre el worktree

Antes de estos cambios ya existian multiples archivos modificados y no rastreados en el repositorio. No se revirtio ningun cambio ajeno.

## Fase 2 - Permisos y limpieza visual

### Auditoria de permisos

Se reviso la relacion entre rutas/paginas del admin y `firestore.rules`.

Estado resultante:

- `Fotos`: lectura/escritura para editor+, borrado solo admin+ desde la UI.
- `Eventos`: lectura para editor+, mutaciones solo admin+ desde la UI.
- `Contactos`: ruta y navegacion solo admin/superadmin.
- `Testimonios`: ruta y navegacion solo admin/superadmin.
- `Servicios`: ruta solo admin/superadmin.
- `Configuracion`: ruta solo admin/superadmin.
- `Usuarios`: ruta solo superadmin.
- `Auditoria`: ruta solo superadmin.

### `admin/src/pages/EventosPage.tsx`

Se agrego `canManageEvents` para alinear la pagina con las reglas:

- `editor` puede ver agenda y filtros.
- `editor` ya no ve botones para crear, editar o eliminar eventos.
- `editor` ve el estado `Solo lectura` en la columna de acciones.
- Los handlers de crear/editar/eliminar retornan temprano si el rol no es `admin` o `superadmin`.

Tambien se limpiaron emojis en badges, filtros y tabla de eventos para mantener una interfaz mas sobria y evitar renderizados inconsistentes en consola/entornos.

## Fase 3 - Hero image en Firebase Storage

### Problema corregido

La imagen de portada del sitio se estaba guardando como Data URL Base64 dentro del documento `configuracion/general`.

Esto se cambio para evitar:

- riesgo de superar el limite de 1 MiB por documento de Firestore;
- lecturas pesadas del documento publico de configuracion;
- falta de cache independiente para la imagen hero.

### Backend

Archivos modificados:

- `functions/src/api/configuracion.ts`
- `functions/src/api/app.ts`
- `functions/src/lib/firebase.ts`
- `functions/src/middleware/auth.ts`

Se agrego el endpoint:

```text
POST /api/v1/configuracion/hero-image
```

Comportamiento:

- requiere token Firebase;
- requiere rol `admin` o `superadmin`;
- recibe una Data URL de imagen;
- valida JPEG, PNG o WEBP;
- rechaza fuentes mayores a 6 MB;
- convierte la imagen a WebP con `sharp`;
- redimensiona a maximo 1440 px de ancho;
- sube el archivo a Firebase Storage bajo `site/hero/`;
- guarda metadata de cache `public, max-age=31536000, immutable`;
- devuelve `heroImagenUrl` y `heroImagenPath`.

Tambien se ajusto `authenticate` para cargar el rol real desde `usuarios/{uid}`, porque `requireRole` depende de `req.user.rol`.

### Admin

Archivos modificados:

- `admin/src/pages/ConfiguracionPage.tsx`
- `admin/vite.config.ts`
- `firebase.json`

Cambios:

- `ConfiguracionPage` ya no guarda la imagen hero como Base64 en Firestore.
- Al seleccionar imagen, el admin la preprocesa y llama al endpoint backend.
- Firestore guarda solo `heroImagenUrl` y `heroImagenPath`.
- `Guardar Cambios` detecta Data URLs antiguas y las migra subiendo la imagen a Storage antes de guardar.
- Se agrego proxy local `/api` en Vite para desarrollo.
- Se agrego rewrite `/api/**` al hosting admin para llegar a la Cloud Function en produccion.

### Landing

No fue necesario cambiar la landing. `useCompanyConfig` ya consume `heroImagenUrl`, y ahora ese campo apunta a una URL real/cacheable en vez de una cadena Base64.

### Correccion adicional

Se corrigio `fontally` a `finally` en `admin/src/components/photos/PhotoEditModal.tsx`.

### Verificacion adicional

Comandos ejecutados:

```bash
cd functions && npm run build
cd functions && npm run lint
cd admin && npm run build
cd admin && npm run lint
```

Resultado:

- builds correctos;
- admin lint correcto con la advertencia previa de `AuthContext`;
- functions lint correcto con warnings preexistentes de `any` y `contacto.ts`.

## Fase 4 - Cierre de P1 en contactos

### `functions/src/api/contacto.ts`

Se corrigio el endpoint publico de contacto para que ya no responda exito si Firestore falla.

Antes:

- `docRef.set()` estaba envuelto en un `try/catch` interno;
- si Firestore fallaba, el endpoint registraba un mensaje de modo desarrollo;
- aun asi respondia `201 success`;
- el contacto podia perderse sin notificacion.

Ahora:

- `await docRef.set(nuevoContacto)` queda dentro del `try` principal;
- cualquier fallo pasa al manejador global de errores;
- el cliente recibe error real y no un falso positivo.

### `firestore.rules`

Se cerro la creacion directa de documentos en `contactos`:

```text
allow create: if false;
```

Con esto el formulario publico debe pasar por Cloud Functions/API, donde existen:

- rate limit;
- honeypot;
- validacion Zod;
- sanitizacion;
- normalizacion de campos;
- trigger de notificacion sobre datos generados por backend.

### Verificacion P1

Comandos ejecutados:

```bash
cd functions && npm run build
cd functions && npm run lint
```

Resultado:

- `functions` build correcto;
- `functions` lint correcto con warnings restantes de `any`;
- desaparecio el warning de `dbError` no usado que venia del catch eliminado.

## Fase 5 - Preproduccion y SEO tecnico

### Landing publica

Archivos modificados:

- `landing/index.html`
- `landing/public/robots.txt`
- `landing/public/sitemap.xml`

Cambios:

- Se reemplazo la metadata base por una configuracion SEO limpia para produccion.
- Se agrego `canonical` apuntando a `https://rmceventos.com/`.
- Se agregaron metadatos Open Graph y Twitter Card con imagen absoluta.
- Se agrego JSON-LD para `LocalBusiness` y `EventService`.
- Se configuro `robots` para permitir indexacion publica.
- Se actualizo `sitemap.xml` con `lastmod` del 2026-08-12.

Nota:

- Si el lanzamiento inicial se hace en `https://rmc-eventos-bo.web.app` en vez de `https://rmceventos.com`, hay que ajustar `canonical`, `og:url`, `robots.txt` y `sitemap.xml` antes del deploy final.

### Admin privado

Archivos modificados:

- `admin/index.html`
- `admin/public/robots.txt`

Cambios:

- Se agrego `<meta name="robots" content="noindex, nofollow" />`.
- Se agrego `robots.txt` con `Disallow: /`.
- El objetivo es evitar indexacion del panel administrativo y concentrar el rastreo en la landing publica.

### API / CORS produccion

Archivo modificado:

- `functions/src/api/app.ts`

Cambios:

- Se habilitaron origenes CORS de produccion:
  - `https://rmc-eventos-bo.web.app`
  - `https://rmc-eventos-admin.web.app`
  - `https://rmceventos.com`
  - `https://www.rmceventos.com`
  - `https://admin.rmceventos.com`

### Verificacion Fase 5

Comandos ejecutados:

```bash
cd landing && npm run build
cd admin && npm run build
cd functions && npm run build
cd admin && npm run lint
cd functions && npm run lint
```

Resultado:

- `landing` build correcto.
- `admin` build correcto.
- `functions` build correcto.
- `admin` lint correcto con una advertencia previa en `AuthContext.tsx`.
- `functions` lint correcto con 19 warnings existentes de `any`.

### Pendientes externos para produccion

Antes de anunciar el sitio publicamente:

- Conectar y verificar el dominio real en Firebase Hosting.
- Confirmar si el dominio canonico final sera `https://rmceventos.com` o el dominio `web.app`.
- Configurar secretos/variables de Functions para correo y Storage.
- Ejecutar deploy de hosting, functions y Firestore rules.
- Probar en produccion:
  - formulario de contacto;
  - carga de hero image;
  - lectura publica de configuracion;
  - bloqueo de escrituras directas en `contactos`;
  - acceso del admin por roles.
- Registrar el dominio en Google Search Console.
- Enviar `https://rmceventos.com/sitemap.xml`.
- Solicitar indexacion de la pagina principal.

## Fase 6 - Checklist operativo de deploy

### Variables de entorno

Archivo creado:

- `functions/.env.example`

Contenido documentado:

- `RESEND_API_KEY`: requerido para enviar correos de contacto con Resend.
- `NOTIFICATION_EMAIL`: correo destino de notificaciones; por defecto `rmc.eventos2631@gmail.com`.

Estado revisado:

- `landing/.env.local`: existe y contiene las variables Firebase Vite requeridas.
- `admin/.env.local`: existe y contiene las variables Firebase Vite requeridas.
- `functions/.env`: no existe todavia; debe crearse antes del deploy si se quiere activar correo en produccion.

### Firebase CLI

Estado revisado:

- El comando global `firebase` no esta instalado en esta maquina.
- `functions/node_modules/.bin` contiene `firebase-functions`, pero no Firebase CLI.
- Se intento verificar `npx firebase-tools --version`, pero quedo pendiente por descarga/red y fue interrumpido antes de autorizar ejecucion con red.

### Bloqueos antes del deploy real

Para ejecutar deploy desde esta maquina falta:

- Instalar o ejecutar Firebase CLI con `npx firebase-tools`.
- Tener sesion iniciada con Firebase CLI (`firebase login` o equivalente).
- Crear `functions/.env` con `RESEND_API_KEY`.
- Confirmar dominio canonico final:
  - `https://rmceventos.com`, o
  - `https://rmc-eventos-bo.web.app` si todavia no se conectara dominio propio.

## Fase 7 - Alineacion sin Firebase Storage

### Decision de arquitectura

Se ajusto la implementacion para no depender de Firebase Cloud Storage, porque el proyecto no usara un bucket de pago.

### Admin

Archivo modificado:

- `admin/src/pages/ConfiguracionPage.tsx`

Cambios:

- La imagen hero ya no se sube a Functions ni a Storage.
- El selector de archivo comprime en navegador y solo permite guardar Data URL si queda por debajo de 200 KB.
- Se agrego un campo para pegar una URL externa de imagen hero.
- Se dejo de usar `heroImagenPath`.
- Al cargar configuracion antigua, se ignora `heroImagenPath` si existia.

### Functions

Archivos modificados:

- `functions/src/api/app.ts`
- `functions/src/lib/firebase.ts`
- `functions/src/api/fotos.ts`
- `functions/package.json`
- `functions/package-lock.json`
- `functions/.env.example`

Cambios:

- Se retiro la ruta `/api/v1/configuracion/hero-image`.
- Se elimino el endpoint `functions/src/api/configuracion.ts`.
- Firebase Admin ya no inicializa ni exporta `storage`.
- La API de fotos ya no intenta borrar archivos de Storage.
- Se elimino `sharp` de Functions.
- `functions/.env.example` queda solo con variables de Resend/notificacion.

### Firebase deploy

Archivo modificado:

- `firebase.json`

Cambio:

- Se retiro la seccion `storage` para que el deploy normal no intente publicar reglas de Storage.

Comando recomendado:

```bash
npx firebase-tools deploy --only firestore:rules,functions,hosting
```

## Fase 8 - Diagnostico de prueba local de contacto

Problema observado:

- La landing en `http://localhost:5173` devolvia `502 Bad Gateway` al llamar `POST /api/v1/contacto`.

Causa:

- Vite proxy apunta `/api` a `http://127.0.0.1:5001`.
- No habia backend local escuchando en el puerto `5001`.

Acciones:

- Se levanto `functions npm run dev` y `/api/v1/health` respondio correctamente.
- El POST de contacto fallo despues por falta de credenciales locales de Firestore.
- Se ajusto `functions/src/dev.ts` para apuntar al emulador local de Firestore con `FIRESTORE_EMULATOR_HOST=127.0.0.1:8080`.

Bloqueo local:

- Firebase Emulator no arranca con Java 17 usando Firebase CLI `15.26.0`.
- La CLI actual requiere Java 21+.

Resultado:

- Para probar contacto localmente hay que instalar Java 21+ y arrancar Firestore Emulator.
- En produccion, Cloud Functions usara credenciales del entorno Firebase y no necesita Java local.

### Defensa adicional en notificaciones

Archivo modificado:

- `functions/src/triggers/emailNotification.ts`

Cambio:

- Se agrego escape HTML para los campos que se insertan en el correo de notificacion.
- Aunque `contactos` ya no permite creacion directa desde cliente y la API sanitiza entrada, esto deja el trigger mas defensivo ante documentos antiguos, migraciones o escrituras administrativas.

Verificacion:

```bash
cd functions && npm run build
cd functions && npm run lint
```

Resultado:

- `functions` build correcto.
- `functions` lint correcto con 19 warnings existentes de `any`.
