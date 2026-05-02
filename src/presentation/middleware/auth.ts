import { Request, Response, NextFunction } from 'express';

// ─────────────────────────────────────────────
//  Auth Middleware
//  Protege rutas que requieren estar logueado.
//  Chequea el flag isAuthenticated en la sesión.
// ─────────────────────────────────────────────

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!(req.session as any).isAuthenticated) {
    res.status(401).json({ error: 'No autenticado. Por favor iniciá sesión.' });
    return;
  }
  next();
}
