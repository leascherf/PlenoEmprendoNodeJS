import 'dotenv/config';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { loadConfig } from './infrastructure/config/config';
import { SheetReader } from './infrastructure/google/SheetReader';
import { MariaDbLeadRepository } from './infrastructure/persistence/mysql/MariaDbLeadRepository';
import { PlenoCredentialsRepository } from './infrastructure/persistence/mysql/PlenoCredentialsRepository';
import { createAuthRouter } from './presentation/routes/auth';
import { leadsRouter } from './presentation/routes/leads';
import { ILeadRepository } from './domain/repositories/ILeadRepository';

declare module 'express-serve-static-core' {
  interface Request {
    leadRepository?: ILeadRepository;
  }
}

async function bootstrap() {
  const config = loadConfig();
  const isProd = config.env === 'production';

  // ── Base de datos ──────────────────────────────────────────────────
  const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // Verificar conexión
  try {
    await pool.execute('SELECT 1');
    console.log('✓ Conexión a MySQL OK');
  } catch (err) {
    console.error('✗ Error conectando a MySQL:', err instanceof Error ? err.message : err);
    process.exit(1);
  }

  // ── Repositorios ───────────────────────────────────────────────────
  const credentialsRepo = new PlenoCredentialsRepository(pool);
  const sheetReader = new SheetReader(config.googleServiceAccountKey);
  const leadRepository = new MariaDbLeadRepository(pool, sheetReader, config.mainSheet);

  // ── Bootstrap: seed de password desde .env ────────────────────────
  await seedAdminPasswordIfNeeded(credentialsRepo, config.adminPassword);

  // ── Express ───────────────────────────────────────────────────────
  const app = express();

  app.set('trust proxy', 1);

  // HTTPS redirect en producción
  if (isProd) {
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.headers['x-forwarded-proto'] === 'https') return next();
      res.redirect(301, 'https://' + req.headers.host + req.url);
    });
  }

  // Helmet — headers de seguridad
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  }));

  // Rate limiting
  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  });
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(globalLimiter);

  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));

  app.use(session({
    name: 'pe.sid',
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000, // 2h
    },
  }));

  // Inyectar el repository en cada request autenticado
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if ((req.session as any).isAuthenticated) {
      req.leadRepository = leadRepository;
    }
    next();
  });

  // ── Rutas API ──────────────────────────────────────────────────────
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth', createAuthRouter(credentialsRepo));
  app.use('/api/leads', leadsRouter);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  // ── Frontend estático (Vue compilado) ──────────────────────────────
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));

  // SPA fallback: cualquier ruta no-API devuelve index.html
  app.get('*', (req: Request, res: Response) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    }
  });

  // ── Arrancar servidor ─────────────────────────────────────────────
  app.listen(config.port, () => {
    console.log(`✓ Servidor escuchando en http://localhost:${config.port}`);
  });
}

// ─────────────────────────────────────────────
//  Bootstrap: si la tabla está vacía y hay ADMIN_PASSWORD en .env,
//  hashear y guardar. Una vez seedeado, ADMIN_PASSWORD puede borrarse del .env.
// ─────────────────────────────────────────────

async function seedAdminPasswordIfNeeded(
  repo: PlenoCredentialsRepository,
  plainPassword: string
): Promise<void> {
  try {
    const existing = await repo.getHash();
    if (existing) return; // ya está seedeado

    if (!plainPassword) {
      console.warn('⚠ No hay contraseña en pleno_credentials ni ADMIN_PASSWORD en .env. El login no funcionará.');
      return;
    }

    const hash = await bcrypt.hash(plainPassword, 12);
    await repo.setHash(hash);
    console.log('✓ Password de admin seedeada desde ADMIN_PASSWORD (.env). Podés borrarla del .env.');
  } catch (err) {
    console.error('✗ Error al inicializar credenciales:', err instanceof Error ? err.message : err);
  }
}

bootstrap().catch(console.error);
