import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import { loadConfig } from './infrastructure/config/sheets';
import { GoogleAuthService } from './infrastructure/google/GoogleAuthService';
import { GoogleSheetsRepository } from './infrastructure/google/GoogleSheetsRepository';
import { createAuthRouter } from './presentation/routes/auth';
import { leadsRouter } from './presentation/routes/leads';
import { ILeadRepository } from './domain/repositories/ILeadRepository';
import { AuthUser } from './domain/services/IAuthService';

// Extender Request para TypeScript
declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: AuthUser;
    leadRepository?: ILeadRepository;
  }
}

async function bootstrap() {
  const config = loadConfig();
  const authService = new GoogleAuthService(config.google);

  const app = express();

  app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
  }));

  app.use(express.json());

  app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  // Middleware: construye el repository una vez por request y lo adjunta a req
  app.use((req: Request, _res: Response, next: NextFunction) => {
    const user = (req.session as any)?.user as AuthUser | undefined;
    if (user) {
      const oauthClient = authService.getAuthenticatedClient(user);
      req.leadRepository = new GoogleSheetsRepository(oauthClient, config.sheets);
      req.currentUser = user;
    }
    next();
  });

  app.use('/api/auth', createAuthRouter(authService));

  // Guard: rechaza requests sin sesión antes de que lleguen al router de leads
  app.use('/api/leads', (req: Request, res: Response, next: NextFunction) => {
    if (!req.leadRepository) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    next();
  });
  app.use('/api/leads', leadsRouter);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, ts: new Date().toISOString() });
  });

  app.listen(config.port, () => {
    console.log(`\nPlenoEmprendo API corriendo en http://localhost:${config.port}`);
    console.log(`   Auth Google: http://localhost:${config.port}/api/auth/google`);
    console.log(`   Health:      http://localhost:${config.port}/api/health\n`);
  });
}

bootstrap().catch(console.error);
