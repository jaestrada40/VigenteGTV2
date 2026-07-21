import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const url = process.env.VERIFY_DATABASE_URL;
if (!url) throw new Error('VERIFY_DATABASE_URL es obligatoria y debe apuntar a una restauración aislada.');
if (url === process.env.DATABASE_URL) throw new Error('La verificación se niega a usar la base de producción.');

const restored = new PrismaClient({ datasources: { db: { url } } });
try {
  const [users, documents, migrations] = await Promise.all([
    restored.user.count(), restored.document.count(), restored.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) AS count FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL`,
  ]);
  const migrationCount = Number(migrations[0]?.count || 0);
  if (migrationCount < 2) throw new Error(`Restauración incompleta: solo ${migrationCount} migraciones aplicadas.`);
  console.log(JSON.stringify({ ok: true, users, documents, migrations: migrationCount, checkedAt: new Date().toISOString() }));
} finally { await restored.$disconnect(); }
