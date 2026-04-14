import { Router, Request, Response } from 'express';
import { IAuthService } from '../../domain/services/IAuthService';

export function createAuthRouter(authService: IAuthService): Router {
  const router = Router();

  // GET /api/auth/google → redirige a Google
  router.get('/google', (_req: Request, res: Response) => {
    const url = authService.getAuthUrl();
    res.redirect(url);
  });

  // GET /api/auth/callback → Google redirige acá después del login
  router.get('/callback', async (req: Request, res: Response) => {
    const code = req.query.code as string;

    if (!code) {
      res.status(400).json({ error: 'Código de autorización faltante' });
      return;
    }

    try {
      const user = await authService.exchangeCode(code);
      // Guardar usuario en sesión
      (req.session as any).user = user;
      // Redirigir al frontend
      const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
      res.redirect(`${frontendUrl}/leads`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error de autenticación';
      res.status(500).json({ error: message });
    }
  });

  // GET /api/auth/me → devuelve el usuario actual
  router.get('/me', (req: Request, res: Response) => {
    const user = (req.session as any).user;
    if (!user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }
    // No devolver tokens al frontend
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  });

  // POST /api/auth/logout
  router.post('/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  return router;
}
