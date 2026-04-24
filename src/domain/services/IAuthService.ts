// ─────────────────────────────────────────────
//  DOMAIN INTERFACE: IAuthService
//  Abstrae la autenticación. El dominio no sabe
//  si es Google, JWT propio, u otro proveedor.
//
//  AuthUser contiene solo identidad — sin tokens.
//  Los tokens son un detalle de infraestructura
//  que vive en GoogleAuthService.
// ─────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface IAuthService {
  /**
   * Genera la URL de redirección para iniciar el flujo OAuth.
   */
  getAuthUrl(): string;

  /**
   * Intercambia el código de callback por la identidad del usuario.
   */
  exchangeCode(code: string): Promise<AuthUser>;
}
