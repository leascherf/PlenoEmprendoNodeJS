// ─────────────────────────────────────────────
//  PRESENTATION: Auth Middleware
//  Protege rutas que requieren estar logueado.
// ─────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { AuthUser } from '../../domain/services/IAuthService';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const user = (req.session as any)?.user as AuthUser | undefined;

  if (!user) {
    res.status(401).json({ error: 'No autenticado. Por favor iniciá sesión con Google.' });
    return;
  }

  // Adjuntar el usuario al request para que los controllers lo usen
  (req as any).currentUser = user;
  next();
}
