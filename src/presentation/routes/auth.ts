import { Router, Request, Response } from 'express';
import { GoogleAuthService } from '../../infrastructure/google/GoogleAuthService';
import { AuthUser } from '../../domain/services/IAuthService';

// El router de auth recibe GoogleAuthService (concreto) porque el flujo
// OAuth es 100% Google — no tiene sentido abstraerlo aquí.
export function createAuthRouter(authService: GoogleAuthService): Router {
  const router = Router();

  // GET /api/auth/google → redirige a Google
  router.get('/google', (_req: Request, res: Response) => {
    res.redirect(authService.getAuthUrl());
  });

  // GET /api/auth/callback → Google redirige acá después del login
  router.get('/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).json({ error: 'Código de autorización faltante' });
      return;
    }

    try {
      const { user, credentials } = await authService.exchangeCodeFull(code);

      // Guardar identidad y credenciales por separado en la sesión.
      // Las credenciales (tokens) son un detalle de infraestructura —
      // no se mezclan con los datos de identidad del usuario.
      (req.session as any).user = user;
      (req.session as any).oauthCredentials = credentials;

      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      res.redirect(`${frontendUrl}/leads`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      res.status(500).json({ error: message });
    }
  });

  // GET /api/auth/me → devuelve solo la identidad del usuario (sin tokens)
  router.get('/me', (req: Request, res: Response) => {
    const user = (req.session as any).user as AuthUser | undefined;
    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    res.json(user);
  });

  // POST /api/auth/logout
  router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  return router;
}
