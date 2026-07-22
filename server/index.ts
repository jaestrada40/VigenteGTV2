import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import cron from 'node-cron';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import { collectDefaultMetrics, Counter, Histogram, register } from 'prom-client';
import { PrismaClient, Role, EmailCategory } from '@prisma/client';
import { z } from 'zod';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import QRCode from 'qrcode';

export const prisma = new PrismaClient();
export const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'test' ? 'test-secret-that-is-at-least-32-characters' : '');
const publicAppUrl = (process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
const legalVersion = process.env.LEGAL_VERSION || '2026-07-21';
const logger = pino({ level: process.env.LOG_LEVEL || 'info', redact: ['req.headers.cookie', 'req.headers.authorization', 'password', 'token'] });

if (jwtSecret.length < 32) throw new Error('JWT_SECRET debe existir y contener al menos 32 caracteres.');
const configuredMfaKey = process.env.MFA_ENCRYPTION_KEY ? Buffer.from(process.env.MFA_ENCRYPTION_KEY, 'base64') : null;
if (isProduction && (!configuredMfaKey || configuredMfaKey.length !== 32)) throw new Error('MFA_ENCRYPTION_KEY debe contener exactamente 32 bytes codificados en Base64.');
const mfaEncryptionKey = configuredMfaKey?.length === 32 ? configuredMfaKey : crypto.createHash('sha256').update(jwtSecret).digest();

declare global {
  namespace Express {
    interface Request { authUser?: { id: string; role: Role; emailVerifiedAt: Date | null; sessionVersion: number; mfaEnabledAt: Date | null } }
  }
}

collectDefaultMetrics({ prefix: 'vigentegt_' });
const httpRequests = new Counter({ name: 'vigentegt_http_requests_total', help: 'Solicitudes HTTP', labelNames: ['method', 'route', 'status'] });
const httpDuration = new Histogram({ name: 'vigentegt_http_request_duration_seconds', help: 'Duración de solicitudes HTTP', labelNames: ['method', 'route', 'status'], buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5] });
const emailDeliveries = new Counter({ name: 'vigentegt_email_deliveries_total', help: 'Intentos de entrega de correo', labelNames: ['category', 'status'] });

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ["'self'", 'data:'], connectSrc: ["'self'"], fontSrc: ["'self'", 'data:'], objectSrc: ["'none'"], frameAncestors: ["'none'"], upgradeInsecureRequests: isProduction ? [] : null } },
  crossOriginEmbedderPolicy: false,
}));
app.use(pinoHttp({ logger, genReqId: (req) => String(req.headers['x-request-id'] || crypto.randomUUID()) }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route?.path || req.path;
    const labels = { method: req.method, route, status: String(res.statusCode) };
    httpRequests.inc(labels);
    end(labels);
  });
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false });
const emailLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: 'lax' as const, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' };

type SafeUserInput = { id: string; email: string; role: Role; createdAt: Date; emailVerifiedAt: Date | null; mfaEnabledAt: Date | null };
const safeUser = (user: SafeUserInput) => ({ id: user.id, email: user.email, isAdmin: user.role === 'ADMIN', emailVerified: Boolean(user.emailVerifiedAt), mfaEnabled: Boolean(user.mfaEnabledAt), mfaRequiredSetup: user.role === 'ADMIN' && !user.mfaEnabledAt, createdAt: user.createdAt.toISOString() });
const passwordSchema = z.string().min(12, 'La contraseña debe tener al menos 12 caracteres.').max(128).refine(value => /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value), 'Incluye mayúscula, minúscula y número.');
const emailSchema = z.string().email().max(254).transform(value => value.trim().toLowerCase());
const credentialsSchema = z.object({ email: emailSchema, password: z.string().min(1).max(128) });
const registerSchema = z.object({ email: emailSchema, password: passwordSchema, acceptedTerms: z.literal(true), acceptedPrivacy: z.literal(true), alertConsent: z.literal(true) });
const documentSchema = z.object({ type: z.enum(['DPI', 'Licencia']), name: z.string().trim().min(1).max(80), expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) });

function signSession(user: { id: string; role: Role; sessionVersion: number }) {
  return jwt.sign({ sub: user.id, role: user.role, sv: user.sessionVersion }, jwtSecret, { expiresIn: '7d', issuer: 'vigentegt', audience: 'vigentegt-web' });
}

async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = jwt.verify(req.cookies.vigentegt_session || '', jwtSecret, { issuer: 'vigentegt', audience: 'vigentegt-web' }) as jwt.JwtPayload;
    const user = await prisma.user.findUnique({ where: { id: String(payload.sub) }, select: { id: true, role: true, emailVerifiedAt: true, sessionVersion: true, mfaEnabledAt: true } });
    if (!user || user.sessionVersion !== payload.sv) throw new Error('invalid session');
    req.authUser = user;
    next();
  } catch { res.status(401).json({ error: 'Tu sesión no es válida o ha expirado.' }); }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.authUser?.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso reservado para administradores.' });
  if (!req.authUser.mfaEnabledAt) return res.status(403).json({ error: 'Configura MFA antes de acceder al panel administrativo.', code: 'MFA_SETUP_REQUIRED' });
  next();
}

function encryptMfaSecret(secret: string) {
  const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', mfaEncryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptMfaSecret(value: string) {
  const [iv, tag, encrypted] = value.split('.');
  if (!iv || !tag || !encrypted) throw new Error('Secreto MFA inválido.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', mfaEncryptionKey, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(encrypted, 'base64url')), decipher.final()]).toString('utf8');
}

function normalizeRecoveryCode(code: string) { return code.trim().toUpperCase().replace(/[^A-F0-9]/g, ''); }
function recoveryCodeHash(code: string) { return crypto.createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex'); }
function createRecoveryCodes() { return Array.from({ length: 10 }, () => crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{1,4}/g)!.join('-')); }

async function verifyMfaCredential(user: { id: string; mfaSecretEncrypted: string | null }, code: string, consumeRecovery = true) {
  if (!user.mfaSecretEncrypted) return false;
  if (/^\d{6}$/.test(code.trim())) {
    const result = await verifyTotp({ secret: decryptMfaSecret(user.mfaSecretEncrypted), token: code.trim(), epochTolerance: 30 });
    return result.valid;
  }
  const recovery = await prisma.mfaRecoveryCode.findUnique({ where: { codeHash: recoveryCodeHash(code) } });
  if (!recovery || recovery.userId !== user.id || recovery.usedAt) return false;
  if (consumeRecovery) await prisma.mfaRecoveryCode.update({ where: { id: recovery.id }, data: { usedAt: new Date() } });
  return true;
}

function requireVerified(req: Request, res: Response, next: NextFunction) {
  if (!req.authUser?.emailVerifiedAt) return res.status(403).json({ error: 'Verifica tu correo antes de activar documentos y alertas.', code: 'EMAIL_NOT_VERIFIED' });
  next();
}

function mailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;
  return nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: process.env.SMTP_SECURE === 'true', auth: { user: SMTP_USER, pass: SMTP_PASSWORD }, connectionTimeout: 10_000, socketTimeout: 15_000 });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
}

function emailTemplate(input: { eyebrow: string; title: string; intro: string; content?: string; actionLabel?: string; actionUrl?: string; accent?: string }) {
  const accent = input.accent || '#2eaa8b';
  const action = input.actionLabel && input.actionUrl
    ? `<tr><td style="padding:8px 40px 30px"><a href="${escapeHtml(input.actionUrl)}" style="display:inline-block;background:${accent};color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;font-weight:700;line-height:20px;padding:13px 22px;border-radius:6px">${escapeHtml(input.actionLabel)}</a></td></tr>`
    : '';
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;background:#f4f7fb;color:#143a66"><div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(input.intro)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb"><tr><td align="center" style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#ffffff;border:1px solid #dfe7f1;border-radius:12px;overflow:hidden"><tr><td style="height:6px;background:${accent}"></td></tr><tr><td style="padding:30px 40px 20px"><table role="presentation" cellspacing="0" cellpadding="0"><tr><td style="width:44px;height:44px;background:#123c68;border-radius:10px;text-align:center;color:#39b99a;font:bold 15px Arial,sans-serif">VG</td><td style="padding-left:13px"><div style="font:bold 20px Arial,sans-serif;color:#123c68">Vigente <span style="color:#2eaa8b">GT</span></div><div style="margin-top:3px;font:10px Arial,sans-serif;letter-spacing:1.5px;color:#7f94ad">CONTROL CIUDADANO</div></td></tr></table></td></tr><tr><td style="padding:4px 40px 10px"><div style="font:bold 11px Arial,sans-serif;letter-spacing:1.3px;color:${accent};text-transform:uppercase">${escapeHtml(input.eyebrow)}</div><h1 style="margin:12px 0 14px;font:700 28px/35px Arial,sans-serif;color:#123c68">${escapeHtml(input.title)}</h1><p style="margin:0;font:16px/25px Arial,sans-serif;color:#4e6682">${escapeHtml(input.intro)}</p></td></tr>${input.content ? `<tr><td style="padding:18px 40px 22px">${input.content}</td></tr>` : ''}${action}<tr><td style="padding:22px 40px;background:#f8fafc;border-top:1px solid #e6edf5"><p style="margin:0 0 7px;font:12px/18px Arial,sans-serif;color:#71849a">Este es un mensaje automático de Vigente GT. Nunca te pediremos contraseñas ni códigos de autenticación por correo.</p><p style="margin:0;font:11px/17px Arial,sans-serif;color:#91a0b2">Servicio independiente de control ciudadano · Guatemala<br><a href="${escapeHtml(publicAppUrl)}" style="color:#2e8f79;text-decoration:none">${escapeHtml(publicAppUrl.replace(/^https?:\/\//, ''))}</a></p></td></tr></table></td></tr></table></body></html>`;
}

async function sendSystemEmail(input: { userId?: string; to: string; category: EmailCategory; subject: string; text: string; html: string }) {
  const transport = mailTransport();
  let deliveryStatus: 'SENT' | 'FAILED' = 'FAILED';
  let providerMessageId: string | undefined;
  let errorMessage: string | undefined;
  try {
    if (!transport) throw new Error('SMTP no está configurado.');
    const result = await transport.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to: input.to, subject: input.subject, text: input.text, html: input.html });
    providerMessageId = result.messageId;
    deliveryStatus = 'SENT';
  } catch (error) { errorMessage = error instanceof Error ? error.message.slice(0, 500) : 'Error de correo'; }
  await prisma.emailDelivery.create({ data: { userId: input.userId, recipientEmail: input.to, category: input.category, deliveryStatus, providerMessageId, errorMessage } });
  emailDeliveries.inc({ category: input.category, status: deliveryStatus });
  logger.info({ category: input.category, deliveryStatus, recipientDomain: input.to.split('@')[1] }, 'email delivery completed');
  return deliveryStatus === 'SENT';
}

function hashToken(token: string) { return crypto.createHash('sha256').update(token).digest('hex'); }

async function issueAccountToken(user: { id: string; email: string }, type: 'VERIFY_EMAIL' | 'RESET_PASSWORD') {
  await prisma.accountToken.deleteMany({ where: { userId: user.id, type, usedAt: null } });
  const rawToken = crypto.randomBytes(32).toString('base64url');
  await prisma.accountToken.create({ data: { userId: user.id, type, tokenHash: hashToken(rawToken), expiresAt: new Date(Date.now() + (type === 'VERIFY_EMAIL' ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000)) } });
  return rawToken;
}

async function sendVerification(user: { id: string; email: string }) {
  const token = await issueAccountToken(user, 'VERIFY_EMAIL');
  const url = `${publicAppUrl}/?verify=${encodeURIComponent(token)}`;
  return sendSystemEmail({ userId: user.id, to: user.email, category: 'VERIFICATION', subject: 'Verifica tu correo — Vigente GT', text: `Verifica tu correo abriendo este enlace: ${url}\n\nEl enlace vence en 24 horas.`, html: emailTemplate({ eyebrow: 'Verificación de cuenta', title: 'Confirma tu correo electrónico', intro: 'Verifica que esta dirección te pertenece para activar tus recordatorios de documentos.', content: '<div style="padding:14px 16px;background:#eef9f6;border-left:4px solid #2eaa8b;border-radius:4px;font:14px/21px Arial,sans-serif;color:#355a55">Este enlace estará disponible durante 24 horas.</div>', actionLabel: 'Verificar mi correo', actionUrl: url }) });
}

async function sendPasswordReset(user: { id: string; email: string }) {
  const token = await issueAccountToken(user, 'RESET_PASSWORD');
  const url = `${publicAppUrl}/?reset=${encodeURIComponent(token)}`;
  return sendSystemEmail({ userId: user.id, to: user.email, category: 'PASSWORD_RESET', subject: 'Restablece tu contraseña — Vigente GT', text: `Restablece tu contraseña abriendo este enlace: ${url}\n\nEl enlace vence en 30 minutos. Si no lo solicitaste, ignora este mensaje.`, html: emailTemplate({ eyebrow: 'Seguridad de la cuenta', title: 'Crea una contraseña nueva', intro: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta.', content: '<div style="padding:14px 16px;background:#fff8e8;border-left:4px solid #d99a24;border-radius:4px;font:14px/21px Arial,sans-serif;color:#66532e">El enlace vence en 30 minutos. Si no hiciste esta solicitud, puedes ignorar el correo.</div>', actionLabel: 'Restablecer contraseña', actionUrl: url, accent: '#d99a24' }) });
}

app.get('/api/health', (_req, res) => res.json({ ok: true, version: process.env.APP_VERSION || 'development' }));
app.get('/api/ready', async (_req, res) => {
  try { await prisma.$queryRaw`SELECT 1`; res.json({ ok: true, database: 'ready' }); }
  catch { res.status(503).json({ ok: false, database: 'unavailable' }); }
});
app.get('/api/metrics', async (req, res) => {
  const expected = process.env.OBSERVABILITY_TOKEN;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) return res.status(404).end();
  res.type(register.contentType).send(await register.metrics());
});

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return res.status(409).json({ error: 'Ese correo ya está registrado.' });
    const user = await prisma.user.create({ data: {
      email: input.email, passwordHash: await bcrypt.hash(input.password, 12),
      consents: { create: [
        { type: 'TERMS', version: legalVersion, ipAddress: req.ip },
        { type: 'PRIVACY', version: legalVersion, ipAddress: req.ip },
        { type: 'ALERT_EMAILS', version: legalVersion, ipAddress: req.ip },
      ] },
    } });
    const verificationEmailSent = await sendVerification(user);
    res.cookie('vigentegt_session', signSession(user), cookieOptions).status(201).json({ user: safeUser(user), verificationEmailSent });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    if (user.mfaEnabledAt) {
      const mfaTicket = jwt.sign({ sub: user.id, purpose: 'mfa-login', sv: user.sessionVersion }, jwtSecret, { expiresIn: '5m', issuer: 'vigentegt', audience: 'vigentegt-mfa' });
      return res.json({ mfaRequired: true, mfaTicket });
    }
    res.cookie('vigentegt_session', signSession(user), cookieOptions).json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/mfa', authLimiter, async (req, res) => {
  const { ticket, code } = z.object({ ticket: z.string().min(20).max(2000), code: z.string().min(6).max(40) }).parse(req.body);
  try {
    const payload = jwt.verify(ticket, jwtSecret, { issuer: 'vigentegt', audience: 'vigentegt-mfa' }) as jwt.JwtPayload;
    if (payload.purpose !== 'mfa-login') throw new Error('invalid purpose');
    const user = await prisma.user.findUnique({ where: { id: String(payload.sub) } });
    if (!user || !user.mfaEnabledAt || user.sessionVersion !== payload.sv || !(await verifyMfaCredential(user, code))) return res.status(401).json({ error: 'Código de autenticación inválido.' });
    res.cookie('vigentegt_session', signSession(user), cookieOptions).json({ user: safeUser(user) });
  } catch { res.status(401).json({ error: 'El segundo paso expiró o no es válido. Inicia sesión nuevamente.' }); }
});

app.post('/api/auth/logout', (_req, res) => res.clearCookie('vigentegt_session', { ...cookieOptions, maxAge: undefined }).status(204).end());
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });
  res.json({ user: safeUser(user) });
});

app.post('/api/auth/verify-email', emailLimiter, async (req, res) => {
  const { token } = z.object({ token: z.string().min(20).max(200) }).parse(req.body);
  const record = await prisma.accountToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!record || record.type !== 'VERIFY_EMAIL' || record.usedAt || record.expiresAt < new Date()) return res.status(400).json({ error: 'El enlace es inválido o ya venció.' });
  await prisma.$transaction([
    prisma.accountToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } }),
  ]);
  res.json({ message: 'Correo verificado correctamente.' });
});

app.post('/api/auth/resend-verification', emailLimiter, requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (user.emailVerifiedAt) return res.json({ message: 'Tu correo ya está verificado.' });
  const sent = await sendVerification(user);
  res.status(sent ? 200 : 503).json(sent ? { message: 'Correo de verificación enviado.' } : { error: 'No se pudo enviar el correo. Intenta más tarde.' });
});

app.post('/api/auth/forgot-password', emailLimiter, async (req, res) => {
  const { email } = z.object({ email: emailSchema }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) await sendPasswordReset(user);
  res.json({ message: 'Si la cuenta existe, recibirás un enlace para restablecer la contraseña.' });
});

app.post('/api/auth/reset-password', emailLimiter, async (req, res) => {
  const { token, password } = z.object({ token: z.string().min(20).max(200), password: passwordSchema }).parse(req.body);
  const record = await prisma.accountToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!record || record.type !== 'RESET_PASSWORD' || record.usedAt || record.expiresAt < new Date()) return res.status(400).json({ error: 'El enlace es inválido o ya venció.' });
  await prisma.$transaction([
    prisma.accountToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(password, 12), sessionVersion: { increment: 1 } } }),
    prisma.accountToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } }),
  ]);
  await sendSystemEmail({ userId: record.userId, to: record.user.email, category: 'PASSWORD_CHANGED', subject: 'Tu contraseña cambió — Vigente GT', text: 'La contraseña de tu cuenta fue actualizada. Si no reconoces este cambio, contacta al administrador.', html: emailTemplate({ eyebrow: 'Aviso de seguridad', title: 'Tu contraseña fue actualizada', intro: 'La contraseña de tu cuenta de Vigente GT cambió correctamente.', content: '<div style="padding:14px 16px;background:#fff0f0;border-left:4px solid #c84a4a;border-radius:4px;font:14px/21px Arial,sans-serif;color:#693c3c">Si no reconoces este cambio, contacta al responsable del servicio inmediatamente.</div>', actionLabel: 'Ir a Vigente GT', actionUrl: publicAppUrl, accent: '#c84a4a' }) });
  res.clearCookie('vigentegt_session', { ...cookieOptions, maxAge: undefined }).json({ message: 'Contraseña actualizada. Inicia sesión nuevamente.' });
});

app.post('/api/auth/change-password', authLimiter, requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = z.object({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) return res.status(400).json({ error: 'La contraseña actual es incorrecta.' });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12), sessionVersion: { increment: 1 } } });
  res.cookie('vigentegt_session', signSession(updated), cookieOptions).json({ message: 'Contraseña actualizada.' });
});

app.post('/api/mfa/setup', authLimiter, requireAuth, async (req, res) => {
  const { password } = z.object({ password: z.string().min(1).max(128) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(400).json({ error: 'La contraseña es incorrecta.' });
  if (user.mfaEnabledAt) return res.status(409).json({ error: 'MFA ya está activado.' });
  const secret = generateSecret();
  await prisma.user.update({ where: { id: user.id }, data: { mfaSecretEncrypted: encryptMfaSecret(secret) } });
  const uri = generateURI({ issuer: 'Vigente GT', label: user.email, secret });
  res.json({ qrCode: await QRCode.toDataURL(uri, { width: 256, margin: 1 }), manualKey: secret });
});

app.post('/api/mfa/enable', authLimiter, requireAuth, async (req, res) => {
  const { code } = z.object({ code: z.string().regex(/^\d{6}$/) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user?.mfaSecretEncrypted || user.mfaEnabledAt) return res.status(400).json({ error: 'Inicia nuevamente la configuración de MFA.' });
  if (!(await verifyMfaCredential(user, code, false))) return res.status(400).json({ error: 'El código no es válido. Revisa la hora de tu dispositivo.' });
  const recoveryCodes = createRecoveryCodes();
  await prisma.$transaction([
    prisma.mfaRecoveryCode.deleteMany({ where: { userId: user.id } }),
    prisma.mfaRecoveryCode.createMany({ data: recoveryCodes.map(recoveryCode => ({ userId: user.id, codeHash: recoveryCodeHash(recoveryCode) })) }),
    prisma.user.update({ where: { id: user.id }, data: { mfaEnabledAt: new Date(), sessionVersion: { increment: 1 } } }),
  ]);
  const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  res.cookie('vigentegt_session', signSession(updated), cookieOptions).json({ recoveryCodes });
});

app.post('/api/mfa/disable', authLimiter, requireAuth, async (req, res) => {
  const { password, code } = z.object({ password: z.string().min(1).max(128), code: z.string().min(6).max(40) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(400).json({ error: 'La contraseña es incorrecta.' });
  if (user.role === 'ADMIN') return res.status(403).json({ error: 'MFA es obligatorio para administradores y no puede desactivarse.' });
  if (!user.mfaEnabledAt || !(await verifyMfaCredential(user, code))) return res.status(400).json({ error: 'El código MFA es incorrecto.' });
  const updated = await prisma.user.update({ where: { id: user.id }, data: { mfaEnabledAt: null, mfaSecretEncrypted: null, sessionVersion: { increment: 1 }, recoveryCodes: { deleteMany: {} } } });
  res.cookie('vigentegt_session', signSession(updated), cookieOptions).json({ message: 'MFA desactivado.' });
});

app.get('/api/account/export', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.authUser!.id },
    include: {
      consents: { orderBy: { createdAt: 'asc' } },
      documents: { include: { notifications: true }, orderBy: { createdAt: 'asc' } },
      emailDeliveries: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  res.setHeader('Content-Disposition', `attachment; filename="vigentegt-datos-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({
    exportedAt: new Date().toISOString(),
    account: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt, emailVerifiedAt: user.emailVerifiedAt },
    consents: user.consents.map(({ type, version, createdAt }) => ({ type, version, createdAt })),
    documents: user.documents,
    emailDeliveries: user.emailDeliveries.map(({ recipientEmail, category, deliveryStatus, createdAt }) => ({ recipientEmail, category, deliveryStatus, createdAt })),
  });
});

app.delete('/api/account', authLimiter, requireAuth, async (req, res) => {
  const { password, confirmation } = z.object({ password: z.string().min(1).max(128), confirmation: z.literal('ELIMINAR') }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(400).json({ error: 'La contraseña es incorrecta.' });
  if (user.role === 'ADMIN') return res.status(403).json({ error: 'La cuenta administradora no puede eliminarse desde la aplicación.' });
  await prisma.$transaction([
    prisma.emailDelivery.deleteMany({ where: { userId: user.id } }),
    prisma.user.delete({ where: { id: user.id } }),
  ]);
  req.log.info({ deletedUserId: user.id }, 'user deleted own account');
  res.clearCookie('vigentegt_session', { ...cookieOptions, maxAge: undefined }).status(204).end();
});

const serializeDocument = (doc: any) => ({ id: doc.id, userId: doc.userId, userEmail: doc.user?.email || '', type: doc.type === 'LICENCIA' ? 'Licencia' : 'DPI', name: doc.name, expiryDate: doc.expiryDate.toISOString().slice(0, 10), createdAt: doc.createdAt.toISOString() });

app.get('/api/documents', requireAuth, async (req, res) => {
  const docs = await prisma.document.findMany({ where: req.authUser!.role === 'ADMIN' ? {} : { userId: req.authUser!.id }, include: { user: true }, orderBy: { createdAt: 'desc' } });
  res.json({ documents: docs.map(serializeDocument) });
});
app.post('/api/documents', requireAuth, requireVerified, async (req, res, next) => {
  try {
    const input = documentSchema.parse(req.body);
    const doc = await prisma.document.create({ data: { userId: req.authUser!.id, type: input.type === 'Licencia' ? 'LICENCIA' : 'DPI', name: input.name, expiryDate: new Date(`${input.expiryDate}T00:00:00.000Z`) }, include: { user: true } });
    res.status(201).json({ document: serializeDocument(doc) });
  } catch (error) { next(error); }
});
app.delete('/api/documents/:id', requireAuth, async (req, res) => {
  const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado.' });
  if (req.authUser!.role !== 'ADMIN' && doc.userId !== req.authUser!.id) return res.status(403).json({ error: 'No puedes eliminar este documento.' });
  await prisma.document.delete({ where: { id: doc.id } }); res.status(204).end();
});

app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [users, documents, logs, deliveryStats] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }), prisma.document.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
    prisma.notificationLog.findMany({ include: { document: true }, orderBy: { sentAt: 'desc' }, take: 500 }),
    prisma.emailDelivery.groupBy({ by: ['deliveryStatus'], where: { createdAt: { gte: since } }, _count: true }),
  ]);
  res.json({ users: users.map(safeUser), documents: documents.map(serializeDocument), deliveryStats, notificationLogs: logs.map(log => ({ id: log.id, userEmail: log.recipientEmail, docType: log.document.type === 'LICENCIA' ? 'Licencia' : 'DPI', docName: log.document.name, expiryDate: log.document.expiryDate.toISOString().slice(0, 10), sentAt: log.sentAt.toISOString(), status: log.statusLabel, deliveryStatus: log.deliveryStatus })) });
});
app.get('/api/admin/smtp-health', requireAuth, requireAdmin, async (_req, res) => {
  const transport = mailTransport();
  if (!transport) return res.status(503).json({ ok: false, error: 'SMTP no está configurado.' });
  try { await transport.verify(); res.json({ ok: true }); } catch (error) { res.status(503).json({ ok: false, error: error instanceof Error ? error.message : 'SMTP no disponible.' }); }
});
app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  if (req.params.id === req.authUser!.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta administrativa.' });
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (user.role === 'ADMIN') return res.status(403).json({ error: 'No se puede eliminar otro administrador desde este panel.' });
  await prisma.user.delete({ where: { id: user.id } }); res.status(204).end();
});

export async function sendReminder(documentId: string, reminderKey?: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId }, include: { user: true } });
  if (!doc) throw new Error('Documento no encontrado.');
  if (!doc.user.emailVerifiedAt) throw new Error('El correo del usuario no está verificado.');
  const days = Math.ceil((doc.expiryDate.getTime() - Date.now()) / 86400000);
  const label = days < 0 ? 'Vencido' : days <= 30 ? 'Urgente' : 'Vence pronto';
  const documentType = doc.type === 'LICENCIA' ? 'Licencia de conducir' : 'DPI';
  const documentName = escapeHtml(doc.name);
  const formattedDate = new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(doc.expiryDate);
  const timing = days < 0 ? `Venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? 'día' : 'días'}` : days === 0 ? 'Vence hoy' : `Faltan ${days} ${days === 1 ? 'día' : 'días'}`;
  const accent = days < 0 ? '#c84a4a' : days <= 30 ? '#d9822b' : '#2eaa8b';
  const details = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f9fc;border:1px solid #e1e8f0;border-radius:8px"><tr><td style="padding:18px 20px"><div style="font:11px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#8293a8">Documento</div><div style="margin-top:5px;font:bold 16px Arial,sans-serif;color:#173e69">${escapeHtml(documentType)} · ${documentName}</div></td></tr><tr><td style="padding:0 20px 18px"><div style="font:11px Arial,sans-serif;letter-spacing:1px;text-transform:uppercase;color:#8293a8">Fecha de vencimiento</div><div style="margin-top:5px;font:bold 16px Arial,sans-serif;color:#173e69">${escapeHtml(formattedDate)}</div><div style="margin-top:8px;display:inline-block;padding:5px 9px;border-radius:12px;background:${accent}18;color:${accent};font:bold 12px Arial,sans-serif">${escapeHtml(timing)}</div></td></tr></table><p style="margin:16px 0 0;font:13px/20px Arial,sans-serif;color:#6b7e93">Te recomendamos iniciar la renovación con suficiente anticipación para evitar multas, restricciones o inconvenientes.</p>`;
  const delivered = await sendSystemEmail({ userId: doc.userId, to: doc.user.email, category: 'REMINDER', subject: `${label}: ${doc.name} — Vigente GT`, text: `${label}. Tu ${documentType} “${doc.name}” vence el ${formattedDate}. ${timing}. Ingresa a ${publicAppUrl}`, html: emailTemplate({ eyebrow: `Alerta de vencimiento · ${label}`, title: days < 0 ? 'Tu documento está vencido' : days === 0 ? 'Tu documento vence hoy' : 'Tu documento vencerá pronto', intro: 'Este recordatorio fue programado desde tu cuenta de Vigente GT.', content: details, actionLabel: 'Revisar mis documentos', actionUrl: publicAppUrl, accent }) });
  const log = await prisma.notificationLog.create({ data: { documentId: doc.id, recipientEmail: doc.user.email, statusLabel: label, deliveryStatus: delivered ? 'SENT' : 'FAILED', reminderKey, errorMessage: delivered ? undefined : 'Consulta EmailDelivery para detalles.' } });
  return { log, delivered };
}

app.post('/api/admin/documents/:id/notify', requireAuth, requireAdmin, async (req, res, next) => {
  try { const result = await sendReminder(req.params.id); res.status(result.delivered ? 200 : 503).json(result.delivered ? { delivered: true } : { delivered: false, error: 'No se pudo entregar el correo.' }); }
  catch (error) { next(error); }
});

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase(); const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios.');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD debe contener al menos 12 caracteres.');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN', emailVerifiedAt: new Date() } });
  else await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN', emailVerifiedAt: existing.emailVerifiedAt || new Date() } });
}

cron.schedule('15 8 * * *', async () => {
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  for (const threshold of [90, 60, 30, 0]) {
    const target = new Date(today.getTime() + threshold * 86400000);
    const docs = await prisma.document.findMany({ where: { expiryDate: target, user: { emailVerifiedAt: { not: null } } } });
    for (const doc of docs) {
      const key = `${doc.id}:${target.toISOString().slice(0, 10)}:${threshold}`;
      if (!(await prisma.notificationLog.findUnique({ where: { reminderKey: key } }))) await sendReminder(doc.id, key).catch(error => logger.error({ err: error }, 'scheduled reminder failed'));
    }
  }
  await prisma.accountToken.deleteMany({ where: { expiresAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
}, { timezone: process.env.TZ || 'America/Guatemala' });

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Datos inválidos.' });
  req.log.error({ err: error }, 'request failed'); res.status(500).json({ error: 'Ocurrió un error interno.', requestId: req.id });
});

if (isProduction) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
}

if (process.env.NODE_ENV !== 'test') {
  await seedAdmin();
  const server = app.listen(port, '0.0.0.0', () => logger.info({ port }, 'Vigente GT started'));
  process.on('SIGTERM', () => server.close(async () => { await prisma.$disconnect(); process.exit(0); }));
}
