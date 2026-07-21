# Operación segura de Vigente GT

## Observabilidad

- `GET /api/health`: comprueba que el proceso HTTP está vivo.
- `GET /api/ready`: comprueba que PostgreSQL responde; úsalo para alertas, no para reinicios agresivos.
- `GET /api/metrics`: métricas Prometheus protegidas con `Authorization: Bearer $OBSERVABILITY_TOKEN`.
- `GET /api/admin/smtp-health`: prueba autenticación y conexión SMTP desde una sesión administrativa.
- Los logs son JSON, incluyen un `requestId` y ocultan cookies y cabeceras de autorización.

Configura alertas por disponibilidad, errores HTTP 5xx, latencia, entregas `FAILED`, espacio en disco de PostgreSQL y expiración TLS.

## Backups y restauración verificada

1. En Coolify activa backups automáticos diarios de PostgreSQL hacia almacenamiento externo S3 compatible.
2. Conserva como mínimo 7 copias diarias y 4 semanales, cifradas y fuera del VPS.
3. Mensualmente restaura la copia más reciente en una base PostgreSQL aislada de la misma versión.
4. Define `VERIFY_DATABASE_URL` apuntando exclusivamente a esa restauración.
5. Ejecuta `npm run db:verify-backup`. El comando rechaza la URL de producción y valida tablas, conteos y migraciones.
6. Registra fecha, resultado, tamaño y tiempo de restauración. Una copia que nunca se restaura no se considera verificada.

## Respuesta a incidentes

- Rota `JWT_SECRET` para cerrar todas las sesiones de forma inmediata.
- Conserva `MFA_ENCRYPTION_KEY` en el almacén privado de Coolify y en una copia segura separada. Rotarla sin migrar los secretos obliga a reinscribir MFA.
- Cambiar una contraseña incrementa `sessionVersion` y revoca sesiones anteriores de esa cuenta.
- Rota credenciales de PostgreSQL y SMTP desde Coolify; nunca las agregues a Git.
- Conserva logs fuera del contenedor con acceso restringido y una política explícita de retención.

## Antes del lanzamiento

- Revisión jurídica de privacidad y términos.
- SPF, DKIM y DMARC para el dominio remitente.
- HTTPS obligatorio y dominio correcto en `PUBLIC_APP_URL`.
- MFA configurado y códigos de recuperación guardados para cada administrador.
- Prueba documentada de recuperación de cuenta, entrega SMTP y restauración de backup.
