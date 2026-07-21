# Vigente GT 🇬🇹

> Alertas privadas para mantener vigentes el DPI y la licencia de conducir en Guatemala.

Vigente GT permite crear una cuenta, registrar fechas de vencimiento y recibir recordatorios por correo. Incluye un panel administrativo protegido para gestionar usuarios, documentos e historial de entregas.

## Funcionalidades

- Registro e inicio de sesión con contraseña cifrada mediante bcrypt.
- Sesión en cookie `httpOnly`, autorización por rol y límites contra intentos abusivos.
- PostgreSQL como fuente única de usuarios, documentos y notificaciones.
- Administrador inicial creado de forma segura desde variables de entorno.
- Panel ciudadano con cálculo de vigencia en tiempo real.
- Panel administrativo protegido por el servidor.
- Correo SMTP real y recordatorios automáticos a los 90, 60, 30 y 0 días.
- Historial que diferencia entregas exitosas y fallidas.
- Verificación de correo obligatoria antes de activar alertas.
- Recuperación y cambio de contraseña con tokens de un solo uso.
- MFA TOTP obligatorio para administradores y opcional para usuarios, con códigos de recuperación.
- Consentimiento versionado, política de privacidad y términos de servicio.
- Métricas Prometheus protegidas, logs JSON y pruebas automatizadas.
- Procedimiento para comprobar restauraciones de respaldos.
- Migraciones Prisma y contenedor Docker preparado para Coolify.

## Tecnologías

React 19, TypeScript, Vite, Tailwind CSS 4, Express, Prisma, PostgreSQL, Nodemailer y Docker.

## Desarrollo local

Requisitos: Node.js 20+, npm y PostgreSQL.

```bash
git clone https://github.com/jaestrada40/VigenteGTV2.git
cd VigenteGTV2
npm install
cp .env.example .env
```

Edita `.env`, crea la base de datos y ejecuta:

```bash
npm run db:generate
npm run db:migrate
PORT=3001 npm run dev:server
```

En otra terminal:

```bash
npm run dev
```

La interfaz estará en [http://localhost:3000](http://localhost:3000). Vite enviará las solicitudes `/api` al backend en el puerto 3001.

## Variables de entorno

| Variable | Obligatoria | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sí | Conexión privada a PostgreSQL |
| `JWT_SECRET` | Sí | Firma de sesiones; mínimo 32 caracteres aleatorios |
| `MFA_ENCRYPTION_KEY` | Sí | Cifra secretos TOTP; exactamente 32 bytes en Base64 |
| `PUBLIC_APP_URL` | Sí | Dominio HTTPS usado en enlaces de verificación y recuperación |
| `OBSERVABILITY_TOKEN` | Sí | Protege el endpoint privado `/api/metrics` |
| `LEGAL_VERSION` | Recomendado | Versión registrada junto a cada consentimiento |
| `PRIVACY_CONTACT` | Recomendado | Contacto responsable de privacidad |
| `LOG_LEVEL` | Recomendado | Nivel de logs JSON, normalmente `info` |
| `ADMIN_EMAIL` | Sí | Correo del administrador inicial |
| `ADMIN_PASSWORD` | Sí | Contraseña inicial; mínimo 12 caracteres |
| `PORT` | Sí | Puerto HTTP, normalmente `3000` |
| `NODE_ENV` | Sí | Usa `production` en Coolify |
| `TZ` | Recomendado | Zona del programador de recordatorios |
| `SMTP_HOST`, `SMTP_PORT` | Para correo | Servidor SMTP |
| `SMTP_USER`, `SMTP_PASSWORD` | Para correo | Credenciales SMTP |
| `SMTP_SECURE` | Para correo | `true` normalmente para puerto 465; `false` para 587 |
| `MAIL_FROM` | Para correo | Remitente visible |

No agregues `.env` al repositorio. Coolify debe guardar los valores reales como variables privadas.

## Despliegue en Coolify

1. Crea una base de datos PostgreSQL dentro del mismo proyecto de Coolify.
2. Crea un recurso **Application** y conecta este repositorio de GitHub.
3. Selecciona **Dockerfile** como método de construcción.
4. Configura el puerto expuesto `3000` y tu dominio con HTTPS.
5. Copia las variables de `.env.example` al panel de variables de Coolify y reemplaza todos los valores.
6. Usa la URL interna de PostgreSQL en `DATABASE_URL`; no necesitas publicar el puerto de la base de datos.
7. Despliega. El contenedor ejecutará `prisma migrate deploy` antes de iniciar la aplicación.
8. Inicia sesión con `ADMIN_EMAIL` y `ADMIN_PASSWORD`. El administrador se crea solo si aún no existe.

Para generar secretos seguros:

```bash
openssl rand -base64 48
```

Genera la clave independiente de MFA con:

```bash
openssl rand -base64 32
```

No cambies `MFA_ENCRYPTION_KEY` después de que existan usuarios con MFA sin ejecutar un proceso de rotación: perderían acceso a sus códigos TOTP y necesitarían recuperación administrativa.

Después del primer acceso cambia la contraseña desde **Seguridad**. El cambio invalida todas las sesiones anteriores de la cuenta.

## Comandos

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Interfaz de desarrollo en el puerto 3000 |
| `npm run dev:server` | API con recarga automática |
| `npm run lint` | Verificación de frontend y backend |
| `npm run build` | Build completo de producción |
| `npm start` | Inicia el servidor compilado |
| `npm run db:migrate` | Aplica migraciones pendientes |
| `npm run db:generate` | Genera el cliente Prisma |
| `npm test` | Ejecuta pruebas automatizadas de API y navegación |
| `npm run db:verify-backup` | Comprueba una restauración aislada indicada por `VERIFY_DATABASE_URL` |

## Estructura

```text
prisma/             esquema y migraciones de PostgreSQL
server/index.ts     API, autenticación, correo y tareas programadas
server/verify-backup.ts  verificación no destructiva de restauraciones
src/                aplicación React
tests/              pruebas de API y navegación
docs/operations.md  runbook de observabilidad y backups
Dockerfile          build reproducible para Coolify
.env.example        inventario de configuración sin secretos
```

## Seguridad y operación

- Las contraseñas nunca se devuelven a la interfaz ni se guardan en texto plano.
- Registrarse con un correo que incluya “admin” no concede privilegios.
- Los endpoints administrativos validan el rol en el servidor.
- La base de datos debe permanecer en la red privada de Coolify.
- Configura respaldos automáticos de PostgreSQL antes de abrir el servicio al público.
- Usa un proveedor SMTP con SPF, DKIM y DMARC configurados para mejorar la entrega.
- Los tokens de verificación y recuperación se guardan como hash, expiran y solo funcionan una vez.
- Las métricas requieren un token distinto de las credenciales administrativas.

## Próximas mejoras

- Segundo factor de autenticación con TOTP o passkeys.
- Verificación de restauraciones automatizada en un entorno aislado.
- Cola de trabajos dedicada para reintentos y volumen alto de correo.
- Revisión legal formal y flujo de eliminación/exportación de datos.

---

Hecho para reducir olvidos en los trámites que importan en Guatemala.
