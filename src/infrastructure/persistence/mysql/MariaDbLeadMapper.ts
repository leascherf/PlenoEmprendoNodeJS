import { Lead, LeadInfo, LeadState, EstadoLead } from '../../../domain/entities/Lead';

// RowData: fila cruda tal como viene de mysql2
export type DbRow = Record<string, unknown>;

// ─────────────────────────────────────────────
//  Conversiones de tipos helpers
// ─────────────────────────────────────────────

function toBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'string') return v === '1' || v.toLowerCase() === 'true';
  return false;
}

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  const d = new Date(String(v));
  return isNaN(d.getTime()) ? null : d;
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function toInt(v: unknown): number {
  const n = parseInt(String(v ?? '0'), 10);
  return isNaN(n) ? 0 : n;
}

function dateVal(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function boolVal(b: boolean): number {
  return b ? 1 : 0;
}

// ─────────────────────────────────────────────
//  DB row → Lead entity
// ─────────────────────────────────────────────

export function dbRowToLead(row: DbRow): Lead {
  const info: LeadInfo = {
    contactId: toStr(row.contact_id),
    nombre: toStr(row.nombre),
    telefono: toStr(row.telefono),
    telefonoNormalizado: toStr(row.telefono_normalizado),
    email: toStr(row.email),
    closer: toStr(row.closer),
    fechaAgendado: toDate(row.fecha_agendado),
    fechaReunion: toDate(row.fecha_reunion),
  };

  const state: LeadState = {
    estadoLead: (toStr(row.estado_lead) as EstadoLead) || '',
    whatsappEnviado: toBool(row.whatsapp_enviado),
    conversacionIniciadaPor: toStr(row.conversacion_iniciada_por) as 'Setter' | 'Lead' | '',
    audioEnviado: toBool(row.audio_enviado),
    fechaCreacionGrupo: toDate(row.fecha_creacion_grupo),
    descripcionGrupo: toStr(row.descripcion_grupo),
    addFoto: toBool(row.add_foto),
    agregarDescripcion: toBool(row.agregar_descripcion),
    linkEnviado: toBool(row.link_enviado),
    fechaEnvioLink: toDate(row.fecha_envio_link),
    clienteEnGrupo: toBool(row.cliente_en_grupo),
    enviarPrimerMensaje: toBool(row.enviar_primer_mensaje),
    primerMensajeTipo: toStr(row.primer_mensaje_tipo),
    pasoACloser: toBool(row.paso_a_closer),
    fechaPasoACloser: toDate(row.fecha_paso_a_closer),
    fechaUltimoSeguimiento: toDate(row.fecha_ultimo_seguimiento),
    reintentosSeguimiento: toInt(row.reintentos_seguimiento),
    seguimientoMarcado: toBool(row.seguimiento_marcado),
    posibleDuplicado: toBool(row.posible_duplicado),
    duplicadoChequeado: toBool(row.duplicado_chequeado),
    cerradoManual: toBool(row.cerrado_manual),
    ultimaActualizacion: toDate(row.ultima_actualizacion),
  };

  return {
    info,
    state,
    source: (toStr(row.source) as Lead['source']) || 'secondary',
  };
}

// ─────────────────────────────────────────────
//  Partial<LeadState> → columnas SQL para UPDATE
// ─────────────────────────────────────────────

export function stateToDbColumns(changes: Partial<LeadState>): Record<string, unknown> {
  const cols: Record<string, unknown> = {};

  if (changes.estadoLead !== undefined)             cols.estado_lead               = changes.estadoLead;
  if (changes.whatsappEnviado !== undefined)         cols.whatsapp_enviado          = boolVal(changes.whatsappEnviado);
  if (changes.conversacionIniciadaPor !== undefined) cols.conversacion_iniciada_por = changes.conversacionIniciadaPor;
  if (changes.audioEnviado !== undefined)            cols.audio_enviado             = boolVal(changes.audioEnviado);
  if (changes.fechaCreacionGrupo !== undefined)      cols.fecha_creacion_grupo      = dateVal(changes.fechaCreacionGrupo);
  if (changes.descripcionGrupo !== undefined)        cols.descripcion_grupo         = changes.descripcionGrupo;
  if (changes.addFoto !== undefined)                 cols.add_foto                  = boolVal(changes.addFoto);
  if (changes.agregarDescripcion !== undefined)      cols.agregar_descripcion       = boolVal(changes.agregarDescripcion);
  if (changes.linkEnviado !== undefined)             cols.link_enviado              = boolVal(changes.linkEnviado);
  if (changes.fechaEnvioLink !== undefined)          cols.fecha_envio_link          = dateVal(changes.fechaEnvioLink);
  if (changes.clienteEnGrupo !== undefined)          cols.cliente_en_grupo          = boolVal(changes.clienteEnGrupo);
  if (changes.enviarPrimerMensaje !== undefined)     cols.enviar_primer_mensaje     = boolVal(changes.enviarPrimerMensaje);
  if (changes.primerMensajeTipo !== undefined)       cols.primer_mensaje_tipo       = changes.primerMensajeTipo;
  if (changes.pasoACloser !== undefined)             cols.paso_a_closer             = boolVal(changes.pasoACloser);
  if (changes.fechaPasoACloser !== undefined)        cols.fecha_paso_a_closer       = dateVal(changes.fechaPasoACloser);
  if (changes.fechaUltimoSeguimiento !== undefined)  cols.fecha_ultimo_seguimiento  = dateVal(changes.fechaUltimoSeguimiento);
  if (changes.reintentosSeguimiento !== undefined)   cols.reintentos_seguimiento    = changes.reintentosSeguimiento;
  if (changes.seguimientoMarcado !== undefined)      cols.seguimiento_marcado       = boolVal(changes.seguimientoMarcado);
  if (changes.posibleDuplicado !== undefined)        cols.posible_duplicado         = boolVal(changes.posibleDuplicado);
  if (changes.duplicadoChequeado !== undefined)      cols.duplicado_chequeado       = boolVal(changes.duplicadoChequeado);
  if (changes.cerradoManual !== undefined)           cols.cerrado_manual            = boolVal(changes.cerradoManual);
  if (changes.ultimaActualizacion !== undefined)     cols.ultima_actualizacion      = dateVal(changes.ultimaActualizacion);

  return cols;
}
