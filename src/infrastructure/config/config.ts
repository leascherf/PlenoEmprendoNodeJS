import { z } from 'zod';

// ─────────────────────────────────────────────
//  INFRASTRUCTURE: Config
//  Equivalente a appsettings.json en .NET.
//  Zod valida y tipea todas las variables de entorno en arranque,
//  así el servidor falla de inmediato con un mensaje claro si falta algo.
// ─────────────────────────────────────────────

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET es requerido'),

  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID es requerido'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET es requerido'),
  GOOGLE_REDIRECT_URI: z.string().url().default('http://localhost:3001/api/auth/callback'),
  TOKEN_STORE_PATH: z.string().default('./.tokens'),

  SHEET_MAIN_ID: z.string().min(1, 'SHEET_MAIN_ID es requerido'),
  SHEET_MAIN_GID: z.string().default('0'),
  SHEET_MAIN_HEADER_ROW: z.coerce.number().default(1),
  SHEET_MAIN_CONTACT_ID_COL: z.string().default('ContactId'),
  SHEET_MAIN_PHONE_COL: z.string().default('RESPUESTAS'),
  SHEET_MAIN_NAME_COL: z.string().default('Nombre'),
  SHEET_MAIN_LASTNAME_COL: z.string().default('Apellido'),
  SHEET_MAIN_EMAIL_COL: z.string().default('Mail'),
  SHEET_MAIN_CLOSER_COL: z.string().default('CLOSER'),
  SHEET_MAIN_ESTADO_COL: z.string().default('Estado Lead'),
  SHEET_MAIN_DATE_COL: z.string().default('Agendado'),

  SHEET_SECONDARY_ID: z.string().min(1, 'SHEET_SECONDARY_ID es requerido'),
  SHEET_SECONDARY_GID: z.string().default('0'),
  SHEET_SECONDARY_HEADER_ROW: z.coerce.number().default(2),
  SHEET_SECONDARY_CONTACT_ID_COL: z.string().default('ContactId'),
  SHEET_SECONDARY_PHONE_COL: z.string().default('Telefono'),
  SHEET_SECONDARY_NAME_COL: z.string().default('Nombre y Apellido Lead'),
  SHEET_SECONDARY_EMAIL_COL: z.string().default('Email'),
  SHEET_SECONDARY_CLOSER_COL: z.string().default('Closer'),
  SHEET_SECONDARY_ESTADO_COL: z.string().default('Estado Lead'),
  SHEET_SECONDARY_DATE_COL: z.string().default('Fecha Inicio Lead'),
});

// Zod infiere el tipo exacto del objeto validado — no necesitás interfaces separadas.
type Env = z.infer<typeof envSchema>;

// ─────────────────────────────────────────────
//  Tipos de configuración de la app
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
  targetColumns?: string[];
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

// ─────────────────────────────────────────────
//  Función principal de carga
// ─────────────────────────────────────────────

export function loadConfig(): AppConfig {
  // parse() valida todo de una vez y lanza un ZodError con todos los campos
  // inválidos listados juntos, en lugar de fallar de a uno como el requireEnv anterior.
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuración inválida. Variables de entorno con error:\n${issues}`);
  }

  const env: Env = result.data;

  return {
    port: env.PORT,
    frontendUrl: env.FRONTEND_URL,
    sessionSecret: env.SESSION_SECRET,

    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      redirectUri: env.GOOGLE_REDIRECT_URI,
      tokenStorePath: env.TOKEN_STORE_PATH,
    },

    sheets: {
      main: {
        sheetId: env.SHEET_MAIN_ID,
        gid: env.SHEET_MAIN_GID,
        headerRowNumber: env.SHEET_MAIN_HEADER_ROW,
        contactIdColumn: env.SHEET_MAIN_CONTACT_ID_COL,
        phoneColumn: env.SHEET_MAIN_PHONE_COL,
        nameColumn: env.SHEET_MAIN_NAME_COL,
        lastNameColumn: env.SHEET_MAIN_LASTNAME_COL,
        emailColumn: env.SHEET_MAIN_EMAIL_COL,
        closerColumn: env.SHEET_MAIN_CLOSER_COL,
        estadoLeadColumn: env.SHEET_MAIN_ESTADO_COL,
        dateColumn: env.SHEET_MAIN_DATE_COL,
      },
      secondary: {
        sheetId: env.SHEET_SECONDARY_ID,
        gid: env.SHEET_SECONDARY_GID,
        headerRowNumber: env.SHEET_SECONDARY_HEADER_ROW,
        contactIdColumn: env.SHEET_SECONDARY_CONTACT_ID_COL,
        phoneColumn: env.SHEET_SECONDARY_PHONE_COL,
        nameColumn: env.SHEET_SECONDARY_NAME_COL,
        lastNameColumn: '',
        emailColumn: env.SHEET_SECONDARY_EMAIL_COL,
        closerColumn: env.SHEET_SECONDARY_CLOSER_COL,
        estadoLeadColumn: env.SHEET_SECONDARY_ESTADO_COL,
        dateColumn: env.SHEET_SECONDARY_DATE_COL,
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
