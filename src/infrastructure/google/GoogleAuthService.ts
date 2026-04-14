// ─────────────────────────────────────────────
//  INFRASTRUCTURE: GoogleAuthService
//  Implementa IAuthService usando Google OAuth 2.0.
//  Equivale a GoogleAuthProvider.cs del WinForms.
// ─────────────────────────────────────────────

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { IAuthService, AuthUser } from '../../domain/services/IAuthService';
import { GoogleOAuthConfig } from '../config/sheets';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

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
      prompt: 'consent', // Fuerza el refresh_token en cada login
    });
  }

  async exchangeCode(code: string): Promise<AuthUser> {
    const { tokens } = await this.client.getToken(code);
    this.client.setCredentials(tokens);

    // Obtener info del usuario
    const oauth2 = google.oauth2({ version: 'v2', auth: this.client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) throw new Error('No se pudo obtener el email del usuario');

    return {
      id: data.id ?? data.email,
      email: data.email,
      name: data.name ?? data.email,
      picture: data.picture ?? '',
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
    };
  }

  async verifyAndRefresh(user: AuthUser): Promise<AuthUser> {
    this.client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    const tokenInfo = await this.client.getTokenInfo(user.accessToken).catch(() => null);

    if (!tokenInfo && user.refreshToken) {
      // Token expirado, refrescar
      const { credentials } = await this.client.refreshAccessToken();
      return {
        ...user,
        accessToken: credentials.access_token!,
      };
    }

    return user;
  }

  /**
   * Devuelve un OAuth2Client configurado con el token del usuario.
   * Usado por GoogleSheetsRepository para hacer llamadas a la API.
   */
  getAuthenticatedClient(user: AuthUser): OAuth2Client {
    const client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
    client.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });
    return client;
  }
}
