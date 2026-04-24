// ─────────────────────────────────────────────
//  DOMAIN ENTITY: Lead
//  Representa un lead completo tal como lo maneja
//  el negocio. Sin dependencias externas.
// ─────────────────────────────────────────────

export interface LeadInfo {
  contactId: string;
  nombre: string;
  telefono: string;
  telefonoNormalizado: string;
  email: string;
  closer: string;
  fechaAgendado: Date | null;
  fechaReunion: Date | null;
}

export interface LeadState {
  estadoLead: EstadoLead;

  // WhatsApp
  whatsappEnviado: boolean;
  conversacionIniciadaPor: 'Setter' | 'Lead' | '';
  audioEnviado: boolean;

  // Grupo
  fechaCreacionGrupo: Date | null;
  descripcionGrupo: string;
  addFoto: boolean;
  agregarDescripcion: boolean;
  linkEnviado: boolean;
  fechaEnvioLink: Date | null;
  clienteEnGrupo: boolean;

  // Primer mensaje / Closer
  enviarPrimerMensaje: boolean;
  primerMensajeTipo: string;
  pasoACloser: boolean;
  fechaPasoACloser: Date | null;

  // Seguimiento
  fechaUltimoSeguimiento: Date | null;
  reintentosSeguimiento: number;
  seguimientoMarcado: boolean;

  // Flags de control
  posibleDuplicado: boolean;
  duplicadoChequeado: boolean;
  cerradoManual: boolean;

  ultimaActualizacion: Date | null;
}

// Todos los valores en Title Case. Los valores anteriores en ALLCAPS ('LEAD INICIADO',
// 'FINALIZADO') venían de la planilla WinForms y se normalizan en LeadMapper.
export type EstadoLead =
  | 'Lead Iniciado'
  | 'Crear Grupo'
  | 'Grupo Creado'
  | 'Link Enviado: Seguimiento'
  | 'Enviar Mensaje en Grupo'
  | 'Notificar al Closer'
  | 'Finalizado'
  | '';

export interface Lead {
  info: LeadInfo;
  state: LeadState;
  source: 'main' | 'secondary' | 'merged';
}

// ─── Helpers de dominio ────────────────────────
// Centralizan las reglas de negocio sobre el estado de un lead.
// Deben usarse en lugar de comparar strings directamente.

export function isFinalized(lead: Lead): boolean {
  return lead.state.estadoLead === 'Finalizado' || lead.state.cerradoManual;
}

export function hasDuplicate(lead: Lead): boolean {
  return lead.state.posibleDuplicado && !lead.state.duplicadoChequeado;
}

export function needsFollowUp(lead: Lead): boolean {
  return lead.state.estadoLead === 'Link Enviado: Seguimiento';
}
