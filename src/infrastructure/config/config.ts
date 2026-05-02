import { z } from 'zod';

// ─────────────────────────────────────────────
//  INFRASTRUCTURE: Config
//  Zod valida y tipea todas las variables de entorno en arranque.
// ─────────────────────────────────────────────

const isProd = process.env.NODE_ENV === 'production';

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.string().default('development'),
  SESSION_SECRET: z.string().min(1, 'SESSION_SECRET es requerido'),

  // Base de datos
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().default('root'),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().default('pleno_app'),

  // Google Service Account (para leer el Sheet principal)
  GOOGLE_SERVICE_ACCOUNT_KEY: z.string().min(1, 'GOOGLE_SERVICE_ACCOUNT_KEY es requerido'),

  // Password del admin (solo para bootstrap inicial — se puede borrar del .env después)
  ADMIN_PASSWORD: z.string().default(''),

  // Sheet principal (alimentado por Calendly, solo lectura)
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
});

type Env = z.infer<typeof envSchema>;

// ─────────────────────────────────────────────
//  Tipos de configuración
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
}

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface AppConfig {
  port: number;
  env: string;
  sessionSecret: string;
  db: DbConfig;
  googleServiceAccountKey: string;
  adminPassword: string;
  mainSheet: SheetConfig;
}

// ─────────────────────────────────────────────
//  Función principal de carga
// ─────────────────────────────────────────────

export function loadConfig(): AppConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Configuración inválida:\n${issues}`);
  }

  const env: Env = result.data;

  // Fail-fast en producción
  if (isProd) {
    const errors: string[] = [];
    if (!env.SESSION_SECRET || env.SESSION_SECRET === 'cambia_esto_por_algo_seguro_al_menos_32_caracteres') {
      errors.push('SESSION_SECRET debe estar configurado en producción');
    }
    if (env.SESSION_SECRET.length < 32) {
      errors.push('SESSION_SECRET debe tener al menos 32 caracteres');
    }
    if (!env.DB_PASSWORD) {
      errors.push('DB_PASSWORD no puede estar vacío en producción');
    }
    if (errors.length) {
      console.error('✗ Configuración inválida:\n' + errors.map(e => `  - ${e}`).join('\n'));
      process.exit(1);
    }
  }

  return {
    port: env.PORT,
    env: env.NODE_ENV,
    sessionSecret: env.SESSION_SECRET,

    db: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    },

    googleServiceAccountKey: env.GOOGLE_SERVICE_ACCOUNT_KEY,
    adminPassword: env.ADMIN_PASSWORD,

    mainSheet: {
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
  };
}
