// ─────────────────────────────────────────────
//  INFRASTRUCTURE: Config
//  Equivale a appsettings.json del WinForms.
//  Los valores sensibles vienen de variables de entorno.
// ─────────────────────────────────────────────

export interface SheetConfig {
  sheetId: string;
  gid: string;
  headerRowNumber: number;
  contactIdColumn: string;
  phoneColumn: string;
  nameColumn: string;
  lastNameColumn: string;
  emailColumn: string;
  closerColumn: string;
  estadoLeadColumn: string;
  dateColumn: string;
  targetColumns?: string[]; // Solo para Secondary
}

export interface SheetsConfig {
  main: SheetConfig;
  secondary: SheetConfig;
}

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tokenStorePath: string;
}

export interface AppConfig {
  google: GoogleOAuthConfig;
  sheets: SheetsConfig;
  port: number;
  frontendUrl: string;
  sessionSecret: string;
}

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Variable de entorno requerida: ${key}`);
  return val;
}

export function loadConfig(): AppConfig {
  return {
    port: parseInt(process.env.PORT ?? '3001'),
    frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    sessionSecret: requireEnv('SESSION_SECRET'),

    google: {
      clientId: requireEnv('GOOGLE_CLIENT_ID'),
      clientSecret: requireEnv('GOOGLE_CLIENT_SECRET'),
      redirectUri: process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3001/api/auth/callback',
      tokenStorePath: process.env.TOKEN_STORE_PATH ?? './.tokens',
    },

    sheets: {
      main: {
        sheetId: requireEnv('SHEET_MAIN_ID'),
        gid: process.env.SHEET_MAIN_GID ?? '0',
        headerRowNumber: parseInt(process.env.SHEET_MAIN_HEADER_ROW ?? '1'),
        contactIdColumn: process.env.SHEET_MAIN_CONTACT_ID_COL ?? 'ContactId',
        phoneColumn: process.env.SHEET_MAIN_PHONE_COL ?? 'RESPUESTAS',
        nameColumn: process.env.SHEET_MAIN_NAME_COL ?? 'Nombre',
        lastNameColumn: process.env.SHEET_MAIN_LASTNAME_COL ?? 'Apellido',
        emailColumn: process.env.SHEET_MAIN_EMAIL_COL ?? 'Mail',
        closerColumn: process.env.SHEET_MAIN_CLOSER_COL ?? 'CLOSER',
        estadoLeadColumn: process.env.SHEET_MAIN_ESTADO_COL ?? 'Estado Lead',
        dateColumn: process.env.SHEET_MAIN_DATE_COL ?? 'Agendado',
      },
      secondary: {
        sheetId: requireEnv('SHEET_SECONDARY_ID'),
        gid: process.env.SHEET_SECONDARY_GID ?? '0',
        headerRowNumber: parseInt(process.env.SHEET_SECONDARY_HEADER_ROW ?? '2'),
        contactIdColumn: process.env.SHEET_SECONDARY_CONTACT_ID_COL ?? 'ContactId',
        phoneColumn: process.env.SHEET_SECONDARY_PHONE_COL ?? 'Telefono',
        nameColumn: process.env.SHEET_SECONDARY_NAME_COL ?? 'Nombre y Apellido Lead',
        lastNameColumn: '',
        emailColumn: process.env.SHEET_SECONDARY_EMAIL_COL ?? 'Email',
        closerColumn: process.env.SHEET_SECONDARY_CLOSER_COL ?? 'Closer',
        estadoLeadColumn: process.env.SHEET_SECONDARY_ESTADO_COL ?? 'Estado Lead',
        dateColumn: process.env.SHEET_SECONDARY_DATE_COL ?? 'Fecha Inicio Lead',
        targetColumns: [
          'ContactId', 'Nombre y Apellido Lead', 'Telefono', 'Email', 'Closer',
          'Estado Lead', 'Fecha Inicio Lead', 'Ultima Actualizacion Lead',
          'Enviar Whatsapp', 'Quien Inicio conversacion', 'Enviar Audio',
          'Fecha Creacion Grupo', 'grupo + descripcion', 'add foto',
          'agregar descripcion grupo', 'enviar link de grupo al lead',
          'Fecha envio link', 'Fecha Ultimo seguimiento', 'N Reintentos Seguimiento',
          'cliente en grupo', 'Enviar 1er mensaje', 'AS O LAN?',
          'Paso a closer', 'Fecha Paso a closer', 'Posible Duplicado',
          'Duplicado Chequeado', 'Cerrado Manual', 'Observaciones',
        ],
      },
    },
  };
}
