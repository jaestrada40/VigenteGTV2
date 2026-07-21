import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { app, prisma } from '../server/index';

describe('API pública y límites de autorización', () => {
  it('publica un health check mínimo', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('rechaza documentos sin una sesión válida', async () => {
    const response = await request(app).get('/api/documents');
    expect(response.status).toBe(401);
  });

  it('no expone métricas sin el token operativo', async () => {
    const response = await request(app).get('/api/metrics');
    expect(response.status).toBe(404);
  });

  it('valida consentimiento y contraseña antes de tocar la base', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: 'persona@example.com', password: 'débil' });
    expect(response.status).toBe(400);
  });
});

afterAll(async () => { await prisma.$disconnect(); });
