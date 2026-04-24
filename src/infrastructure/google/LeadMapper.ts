// ─────────────────────────────────────────────
//  INFRASTRUCTURE: LeadMapper
//  Convierte filas crudas de Google Sheets → entidades Lead.
//  Equivale a LeadRowMapper.cs + LeadRecord.cs del WinForms.
// ─────────────────────────────────────────────

import { Lead, LeadInfo, LeadState, EstadoLead } from '../../domain/entities/Lead';
import { SheetConfig } from '../config/config';

// Fila cruda tal como llega de Sheets API (array de strings)
export type RawRow = Record<string, string>;

const ESTADO_LEAD_NORMALIZE: Record<string, EstadoLead> = {
  'lead iniciado': 'LEAD INICIADO',
  'crear grupo': 'Crear Grupo',
  'grupo creado': 'Grupo Creado',
  'link enviado: seguimiento': 'Link Enviado: Seguimiento',
  'link enviado seguimiento': 'Link Enviado: Seguimiento',
  'enviar mensaje en grupo': 'Enviar mensaje en grupo',
  'notificar al closer': 'Notificar al Closer',
  'finalizado': 'FINALIZADO',
  'cerrado manualmente': 'FINALIZADO',
};

export class LeadMapper {
  constructor(
    private readonly mainCfg: SheetConfig,
    private readonly secCfg: SheetConfig
  ) {}

  /**
   * Convierte una fila mergeada (Main + Secondary) en una entidad Lead.
   */
  fromMergedRow(row: RawRow): Lead {
    const info = this.extractInfo(row);
    const state = this.extractState(row);
    return { info, state, source: 'merged' };
  }

  fromMainRow(row: RawRow): Partial<Lead> {
    return { info: this.extractInfo(row), source: 'main' };
  }

  fromSecondaryRow(row: RawRow): Partial<Lead> {
    return { state: this.extractState(row), source: 'secondary' };
  }

  // ── Serialización inversa: Lead → objeto para escribir en Sheets ──

  stateToSheetRow(state: Partial<LeadState>): Record<string, string> {
    const row: Record<string, string> = {};

    if (state.estadoLead !== undefined)         row['Estado Lead'] = state.estadoLead;
    if (state.whatsappEnviado !== undefined)     row['Enviar Whatsapp'] = boolStr(state.whatsappEnviado);
    if (state.conversacionIniciadaPor !== undefined) row['Quien Inicio conversacion'] = state.conversacionIniciadaPor;
    if (state.audioEnviado !== undefined)        row['Enviar Audio'] = boolStr(state.audioEnviado);
    if (state.fechaCreacionGrupo !== undefined)  row['Fecha Creacion Grupo'] = dateStr(state.fechaCreacionGrupo);
    if (state.descripcionGrupo !== undefined)    row['grupo + descripcion'] = state.descripcionGrupo;
    if (state.addFoto !== undefined)             row['add foto'] = boolStr(state.addFoto);
    if (state.agregarDescripcion !== undefined)  row['agregar descripcion grupo'] = boolStr(state.agregarDescripcion);
    if (state.linkEnviado !== undefined)         row['enviar link de grupo al lead'] = boolStr(state.linkEnviado);
    if (state.fechaEnvioLink !== undefined)      row['Fecha envio link'] = dateStr(state.fechaEnvioLink);
    if (state.clienteEnGrupo !== undefined)      row['cliente en grupo'] = boolStr(state.clienteEnGrupo);
    if (state.enviarPrimerMensaje !== undefined) row['Enviar 1er mensaje'] = boolStr(state.enviarPrimerMensaje);
    if (state.primerMensajeTipo !== undefined)   row['AS O LAN?'] = state.primerMensajeTipo;
    if (state.pasoACloser !== undefined)         row['Paso a closer'] = boolStr(state.pasoACloser);
    if (state.fechaPasoACloser !== undefined)    row['Fecha Paso a closer'] = dateStr(state.fechaPasoACloser);
    if (state.posibleDuplicado !== undefined)    row['Posible Duplicado'] = boolStr(state.posibleDuplicado);
    if (state.duplicadoChequeado !== undefined)  row['Duplicado Chequeado'] = boolStr(state.duplicadoChequeado);
    if (state.cerradoManual !== undefined)       row['Cerrado Manual'] = boolStr(state.cerradoManual);
    if (state.fechaUltimoSeguimiento !== undefined) row['Fecha Ultimo seguimiento'] = dateStr(state.fechaUltimoSeguimiento);
    if (state.reintentosSeguimiento !== undefined) row['N Reintentos Seguimiento'] = String(state.reintentosSeguimiento);
    if (state.ultimaActualizacion !== undefined) row['Ultima Actualizacion Lead'] = dateStr(state.ultimaActualizacion);

    return row;
  }

  // ── Privados ──────────────────────────────────────────────────────

  private extractInfo(row: RawRow): LeadInfo {
    const cfg = this.mainCfg;

    const nombre = this.getString(row,
      'Nombre y Apellido Lead',
      `${cfg.nameColumn} ${cfg.lastNameColumn}`.trim(),
      cfg.nameColumn,
      'Nombre'
    );

    const telefono = this.getString(row,
      cfg.phoneColumn, this.secCfg.phoneColumn, 'Tel', 'Telefono', 'RESPUESTAS'
    );

    return {
      contactId: this.getString(row, cfg.contactIdColumn, 'ContactId'),
      nombre,
      telefono,
      telefonoNormalizado: normalizePhone(telefono),
      email: this.getString(row, cfg.emailColumn, 'Email', 'Mail', 'MAIL'),
      closer: this.getString(row, cfg.closerColumn, 'Closer', 'CLOSER'),
      fechaAgendado: this.getDate(row, cfg.dateColumn, 'Agendado', 'Fecha Inicio Lead'),
      fechaReunion: this.getDate(row, 'DIA Y HORARIO', 'Fecha Reunion'),
    };
  }

  private extractState(row: RawRow): LeadState {
    const estadoRaw = this.getString(row, 'Estado Lead', 'EstadoLead', 'Estado');
    const estadoLead = normalizeEstado(estadoRaw);

    return {
      estadoLead,
      whatsappEnviado: this.getBool(row, 'Enviar Whatsapp'),
      conversacionIniciadaPor: this.getString(row, 'Quien Inicio conversacion') as 'Setter' | 'Lead' | '',
      audioEnviado: this.getBool(row, 'Enviar Audio'),
      fechaCreacionGrupo: this.getDate(row, 'Fecha Creacion Grupo'),
      descripcionGrupo: this.getString(row, 'grupo + descripcion', 'RESPUESTAS'),
      addFoto: this.getBool(row, 'add foto'),
      agregarDescripcion: this.getBool(row, 'agregar descripcion grupo'),
      linkEnviado: this.getBool(row, 'enviar link de grupo al lead'),
      fechaEnvioLink: this.getDate(row, 'Fecha envio link'),
      clienteEnGrupo: this.getBool(row, 'cliente en grupo'),
      enviarPrimerMensaje: this.getBool(row, 'Enviar 1er mensaje'),
      primerMensajeTipo: this.getString(row, 'AS O LAN?'),
      pasoACloser: this.getBool(row, 'Paso a closer'),
      fechaPasoACloser: this.getDate(row, 'Fecha Paso a closer'),
      posibleDuplicado: this.getBool(row, 'Posible Duplicado'),
      duplicadoChequeado: this.getBool(row, 'Duplicado Chequeado'),
      cerradoManual: this.getBool(row, 'Cerrado Manual'),
      fechaUltimoSeguimiento: this.getDate(row, 'Fecha Ultimo seguimiento'),
      reintentosSeguimiento: parseInt(this.getString(row, 'N Reintentos Seguimiento') || '0') || 0,
      seguimientoMarcado: false,
      ultimaActualizacion: this.getDate(row, 'Ultima Actualizacion Lead'),
    };
  }

  private getString(row: RawRow, ...keys: string[]): string {
    for (const key of keys) {
      const val = row[key]?.trim();
      if (val) return val;
    }
    return '';
  }

  private getBool(row: RawRow, ...keys: string[]): boolean {
    const val = this.getString(row, ...keys).toLowerCase();
    return val === 'true' || val === 'sí' || val === 'si' || val === '1' || val === 'yes';
  }

  private getDate(row: RawRow, ...keys: string[]): Date | null {
    const val = this.getString(row, ...keys);
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }
}

// ── Helpers puros ─────────────────────────────────────────────────────

function normalizeEstado(raw: string): EstadoLead {
  const key = raw.trim().toLowerCase();
  return ESTADO_LEAD_NORMALIZE[key] ?? (raw as EstadoLead) ?? '';
}

export function normalizePhone(phone: string, countryCode = '54'): string {
  if (!phone) return '';
  let digits = phone.replace(/\D/g, '');
  if (!digits.startsWith(countryCode)) {
    digits = countryCode + digits;
  }
  return digits;
}

function boolStr(val: boolean): string {
  return val ? 'TRUE' : 'FALSE';
}

function dateStr(val: Date | null | undefined): string {
  if (!val) return '';
  return val.toISOString();
}
