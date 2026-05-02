import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PlenoCredentialsRepository } from '../../infrastructure/persistence/mysql/PlenoCredentialsRepository';

// ─────────────────────────────────────────────
//  Auth router — password simple (bcrypt + session)
//  Reemplaza el flujo OAuth de Google.
// ─────────────────────────────────────────────

export function createAuthRouter(credentialsRepo: PlenoCredentialsRepository): Router {
  const router = Router();

  // POST /api/auth/login
  router.post('/login', async (req: Request, res: Response) => {
    const { password } = req.body ?? {};

    if (typeof password !== 'string' || !password) {
      res.status(400).json({ error: 'Contraseña requerida' });
      return;
    }

    try {
      const hash = await credentialsRepo.getHash();
      if (!hash) {
        res.status(500).json({ error: 'El panel todavía no fue inicializado' });
        return;
      }

      const ok = await bcrypt.compare(password, hash);
      if (!ok) {
        res.status(401).json({ error: 'Contraseña incorrecta' });
        return;
      }

      (req.session as any).isAuthenticated = true;
      res.json({ ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      res.status(500).json({ error: message });
    }
  });

  // GET /api/auth/me — confirma si hay sesión activa
  router.get('/me', (req: Request, res: Response) => {
    if (!(req.session as any).isAuthenticated) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    res.json({ authenticated: true });
  });

  // POST /api/auth/logout
  router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  return router;
}
