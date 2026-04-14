export type EstadoLead =
  | 'LEAD INICIADO'
  | 'Crear Grupo'
  | 'Grupo Creado'
  | 'Link Enviado: Seguimiento'
  | 'Enviar mensaje en grupo'
  | 'Notificar al Closer'
  | 'FINALIZADO'
  | ''

export interface LeadInfo {
  contactId: string
  nombre: string
  telefono: string
  telefonoNormalizado: string
  email: string
  closer: string
  fechaAgendado: string | null
  fechaReunion: string | null
}

export interface LeadState {
  estadoLead: EstadoLead

  // WhatsApp
  whatsappEnviado: boolean
  conversacionIniciadaPor: 'Setter' | 'Lead' | ''
  audioEnviado: boolean

  // Grupo
  fechaCreacionGrupo: string | null
  descripcionGrupo: string
  addFoto: boolean
  agregarDescripcion: boolean
  linkEnviado: boolean
  fechaEnvioLink: string | null
  clienteEnGrupo: boolean

  // Primer mensaje / Closer
  enviarPrimerMensaje: boolean
  primerMensajeTipo: string
  pasoACloser: boolean
  fechaPasoACloser: string | null

  // Seguimiento
  fechaUltimoSeguimiento: string | null
  reintentosSeguimiento: number
  seguimientoMarcado: boolean

  // Flags de control
  posibleDuplicado: boolean
  duplicadoChequeado: boolean
  cerradoManual: boolean

  ultimaActualizacion: string | null
}

export interface Lead {
  info: LeadInfo
  state: LeadState
  source: 'main' | 'secondary' | 'merged'
}

export const ESTADO_COLORS: Record<string, string> = {
  'LEAD INICIADO': 'bg-yellow-100 text-yellow-800',
  'Crear Grupo': 'bg-blue-100 text-blue-800',
  'Grupo Creado': 'bg-green-100 text-green-800',
  'Link Enviado: Seguimiento': 'bg-red-100 text-red-800',
  'Enviar mensaje en grupo': 'bg-purple-100 text-purple-800',
  'Notificar al Closer': 'bg-pink-100 text-pink-800',
  'FINALIZADO': 'bg-gray-100 text-gray-600',
}

export const ESTADO_ROW_COLORS: Record<string, string> = {
  'LEAD INICIADO': 'bg-yellow-50',
  'Crear Grupo': 'bg-blue-50',
  'Grupo Creado': 'bg-green-50',
  'Link Enviado: Seguimiento': 'bg-red-50',
  'Enviar mensaje en grupo': 'bg-purple-50',
  'Notificar al Closer': 'bg-pink-50',
  'FINALIZADO': 'bg-gray-50',
}

export const ESTADOS: EstadoLead[] = [
  'LEAD INICIADO',
  'Crear Grupo',
  'Grupo Creado',
  'Link Enviado: Seguimiento',
  'Enviar mensaje en grupo',
  'Notificar al Closer',
  'FINALIZADO',
]
