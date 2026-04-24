// ─────────────────────────────────────────────
//  INFRASTRUCTURE: GoogleAuthService
//  Implementa IAuthService usando Google OAuth 2.0.
// ─────────────────────────────────────────────

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { IAuthService, AuthUser } from '../../domain/services/IAuthService';
import { GoogleOAuthConfig } from '../config/config';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// Tokens de Google — detalle de infraestructura, no del dominio.
export interface GoogleAuthCredentials {
  accessToken: string;
  refreshToken?: string;
}

// Lo que se guarda en la sesión: identidad + credenciales por separado.
export interface GoogleUserSession {
  user: AuthUser;
  credentials: GoogleAuthCredentials;
}

export class GoogleAuthService implements IAuthService {
  private readonly client: OAuth2Client;

  constructor(private readonly config: GoogleOAuthConfig) {
    this.client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  getAuthUrl(): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
  }

  // Implementación del contrato del dominio — solo devuelve identidad.
  async exchangeCode(code: string): Promise<AuthUser> {
    const { user } = await this.exchangeCodeFull(code);
    return user;
  }

  // Versión extendida para el flujo OAuth: devuelve identidad + credenciales.
  // Usada por el router de auth (infraestructura), que sí conoce Google.
  async exchangeCodeFull(code: string): Promise<GoogleUserSession> {
    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: this.client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) throw new Error('No se pudo obtener el email del usuario');

    const user: AuthUser = {
      id: data.id ?? data.email,
      email: data.email,
      name: data.name ?? data.email,
      picture: data.picture ?? '',
    };

    const credentials: GoogleAuthCredentials = {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
    };

    return { user, credentials };
  }

  // Refresca el accessToken si venció, usando el refreshToken.
  async refreshIfNeeded(credentials: GoogleAuthCredentials): Promise<GoogleAuthCredentials> {
    this.client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });

    const tokenInfo = await this.client.getTokenInfo(credentials.accessToken).catch(() => null);

    if (!tokenInfo && credentials.refreshToken) {
      const { credentials: newCreds } = await this.client.refreshAccessToken();
      return { ...credentials, accessToken: newCreds.access_token! };
    }

    return credentials;
  }

  // Crea un OAuth2Client listo para usar en llamadas a la API de Google.
  getAuthenticatedClient(credentials: GoogleAuthCredentials): OAuth2Client {
    const client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
    client.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
    return client;
  }
}
