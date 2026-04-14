// ─────────────────────────────────────────────
//  DOMAIN INTERFACE: IAuthService
//  Abstrae la autenticación. El dominio no sabe
//  si es Google, JWT propio, u otro proveedor.
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
  refreshToken?: string;
}

export interface IAuthService {
  /**
   * Genera la URL de redirección para iniciar el flujo OAuth.
   */
  getAuthUrl(): string;

  /**
   * Intercambia el código de callback por un usuario autenticado.
   */
  exchangeCode(code: string): Promise<AuthUser>;

  /**
   * Verifica si un access token sigue siendo válido.
   * Refresca automáticamente si hay refreshToken disponible.
   */
  verifyAndRefresh(user: AuthUser): Promise<AuthUser>;
}
