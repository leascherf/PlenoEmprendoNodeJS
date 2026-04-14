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

export type EstadoLead =
  | 'LEAD INICIADO'
  | 'Crear Grupo'
  | 'Grupo Creado'
  | 'Link Enviado: Seguimiento'
  | 'Enviar mensaje en grupo'
  | 'Notificar al Closer'
  | 'FINALIZADO'
  | '';

// Entidad completa que circula por la app
export interface Lead {
  info: LeadInfo;
  state: LeadState;
  // Fuente de los datos para auditoría
  source: 'main' | 'secondary' | 'merged';
}

// ─── Value objects / helpers ───────────────────

export function isFinalized(lead: Lead): boolean {
  return (
    lead.state.estadoLead === 'FINALIZADO' || lead.state.cerradoManual
  );
}

export function hasDuplicate(lead: Lead): boolean {
  return lead.state.posibleDuplicado && !lead.state.duplicadoChequeado;
}

export function needsFollowUp(lead: Lead): boolean {
  return lead.state.estadoLead === 'Link Enviado: Seguimiento';
}
