import 'dotenv/config';
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
import { PrismaClient, Role } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error('JWT_SECRET debe existir y contener al menos 32 caracteres.');
}

declare global {
  namespace Express {
    interface Request { authUser?: { id: string; role: Role } }
  }
}

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });
const cookieOptions = { httpOnly: true, secure: isProduction, sameSite: 'lax' as const, maxAge: 7 * 24 * 60 * 60 * 1000 };

const safeUser = (user: { id: string; email: string; role: Role; createdAt: Date }) => ({
  id: user.id,
  email: user.email,
  isAdmin: user.role === 'ADMIN',
  createdAt: user.createdAt.toISOString(),
});

function signSession(user: { id: string; role: Role }) {
  return jwt.sign({ sub: user.id, role: user.role }, jwtSecret!, { expiresIn: '7d' });
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = jwt.verify(req.cookies.vigentegt_session || '', jwtSecret!) as jwt.JwtPayload;
    req.authUser = { id: String(payload.sub), role: payload.role as Role };
    next();
  } catch {
    res.status(401).json({ error: 'Tu sesión no es válida o ha expirado.' });
  }
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.authUser?.role !== 'ADMIN') return res.status(403).json({ error: 'Acceso reservado para administradores.' });
  next();
}

const credentialsSchema = z.object({ email: z.string().email().max(254).transform(v => v.trim().toLowerCase()), password: z.string().min(10).max(128) });
const documentSchema = z.object({
  type: z.enum(['DPI', 'Licencia']),
  name: z.string().trim().min(1).max(80),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/auth/register', authLimiter, async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) return res.status(409).json({ error: 'Ese correo ya está registrado.' });
    const user = await prisma.user.create({ data: { email: input.email, passwordHash: await bcrypt.hash(input.password, 12) } });
    res.cookie('vigentegt_session', signSession(user), cookieOptions).status(201).json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/login', authLimiter, async (req, res, next) => {
  try {
    const input = credentialsSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    res.cookie('vigentegt_session', signSession(user), cookieOptions).json({ user: safeUser(user) });
  } catch (error) { next(error); }
});

app.post('/api/auth/logout', (_req, res) => res.clearCookie('vigentegt_session', cookieOptions).status(204).end());
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.authUser!.id } });
  if (!user) return res.status(401).json({ error: 'Usuario no encontrado.' });
  res.json({ user: safeUser(user) });
});

const serializeDocument = (doc: any) => ({
  id: doc.id, userId: doc.userId, userEmail: doc.user?.email || '', type: doc.type === 'LICENCIA' ? 'Licencia' : 'DPI',
  name: doc.name, expiryDate: doc.expiryDate.toISOString().slice(0, 10), createdAt: doc.createdAt.toISOString(),
});

app.get('/api/documents', requireAuth, async (req, res) => {
  const docs = await prisma.document.findMany({
    where: req.authUser!.role === 'ADMIN' ? {} : { userId: req.authUser!.id }, include: { user: true }, orderBy: { createdAt: 'desc' },
  });
  res.json({ documents: docs.map(serializeDocument) });
});

app.post('/api/documents', requireAuth, async (req, res, next) => {
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
  await prisma.document.delete({ where: { id: doc.id } });
  res.status(204).end();
});

app.get('/api/admin/overview', requireAuth, requireAdmin, async (_req, res) => {
  const [users, documents, logs] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.document.findMany({ include: { user: true }, orderBy: { createdAt: 'desc' } }),
    prisma.notificationLog.findMany({ include: { document: true }, orderBy: { sentAt: 'desc' }, take: 500 }),
  ]);
  res.json({ users: users.map(safeUser), documents: documents.map(serializeDocument), notificationLogs: logs.map(log => ({ id: log.id, userEmail: log.recipientEmail, docType: log.document.type === 'LICENCIA' ? 'Licencia' : 'DPI', docName: log.document.name, expiryDate: log.document.expiryDate.toISOString().slice(0, 10), sentAt: log.sentAt.toISOString(), status: log.statusLabel, deliveryStatus: log.deliveryStatus })) });
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  if (req.params.id === req.authUser!.id) return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta administrativa.' });
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  if (user.role === 'ADMIN') return res.status(403).json({ error: 'No se puede eliminar otro administrador desde este panel.' });
  await prisma.user.delete({ where: { id: user.id } });
  res.status(204).end();
});

function mailTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD) return null;
  return nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: process.env.SMTP_SECURE === 'true', auth: { user: SMTP_USER, pass: SMTP_PASSWORD } });
}

async function sendReminder(documentId: string, reminderKey?: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId }, include: { user: true } });
  if (!doc) throw new Error('Documento no encontrado.');
  const days = Math.ceil((doc.expiryDate.getTime() - Date.now()) / 86400000);
  const label = days < 0 ? 'Vencido' : days <= 30 ? 'Urgente' : 'Vence pronto';
  const transport = mailTransport();
  let deliveryStatus: 'SENT' | 'FAILED' = 'FAILED';
  let errorMessage: string | undefined;
  try {
    if (!transport) throw new Error('SMTP no está configurado.');
    await transport.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to: doc.user.email,
      subject: `${label}: ${doc.name} — Vigente GT`,
      text: `Tu ${doc.type === 'LICENCIA' ? 'Licencia' : 'DPI'} “${doc.name}” vence el ${doc.expiryDate.toISOString().slice(0, 10)}. Ingresa a Vigente GT para revisar el estado.`,
    });
    deliveryStatus = 'SENT';
  } catch (error) { errorMessage = error instanceof Error ? error.message : 'Error de correo'; }
  const log = await prisma.notificationLog.create({ data: { documentId: doc.id, recipientEmail: doc.user.email, statusLabel: label, deliveryStatus, reminderKey, errorMessage } });
  return { log, delivered: deliveryStatus === 'SENT' };
}

app.post('/api/admin/documents/:id/notify', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const result = await sendReminder(req.params.id);
    res.status(result.delivered ? 200 : 503).json({ delivered: result.delivered, error: result.delivered ? undefined : 'No se pudo entregar el correo. Revisa la configuración SMTP.' });
  } catch (error) { next(error); }
});

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error('ADMIN_EMAIL y ADMIN_PASSWORD son obligatorios.');
  if (password.length < 12) throw new Error('ADMIN_PASSWORD debe contener al menos 12 caracteres.');
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) await prisma.user.create({ data: { email, passwordHash: await bcrypt.hash(password, 12), role: 'ADMIN' } });
  else if (existing.role !== 'ADMIN') await prisma.user.update({ where: { id: existing.id }, data: { role: 'ADMIN' } });
}

cron.schedule('15 8 * * *', async () => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (const threshold of [90, 60, 30, 0]) {
    const target = new Date(today.getTime() + threshold * 86400000);
    const docs = await prisma.document.findMany({ where: { expiryDate: target } });
    for (const doc of docs) {
      const key = `${doc.id}:${target.toISOString().slice(0, 10)}:${threshold}`;
      if (!(await prisma.notificationLog.findUnique({ where: { reminderKey: key } }))) await sendReminder(doc.id, key);
    }
  }
}, { timezone: process.env.TZ || 'America/Guatemala' });

app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof z.ZodError) return res.status(400).json({ error: error.issues[0]?.message || 'Datos inválidos.' });
  console.error(error);
  res.status(500).json({ error: 'Ocurrió un error interno.' });
});

if (isProduction) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  app.use(express.static(path.join(root, 'dist')));
  app.get('*', (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
}

await seedAdmin();
app.listen(port, '0.0.0.0', () => console.log(`Vigente GT disponible en el puerto ${port}`));

process.on('SIGTERM', async () => { await prisma.$disconnect(); process.exit(0); });
