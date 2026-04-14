// ─────────────────────────────────────────────
//  DOMAIN INTERFACE: ILeadRepository
//  El dominio define QUÉ necesita.
//  La infraestructura define CÓMO lo obtiene.
//  Esta interfaz no sabe nada de Google.
// ─────────────────────────────────────────────

import { Lead } from '../entities/Lead';

export interface LeadFilter {
  search?: string;
  estadoLead?: string;
  closer?: string;
  soloConDuplicados?: boolean;
  soloConSeguimiento?: boolean;
  limit?: number;
}

export interface ILeadRepository {
  /**
   * Devuelve todos los leads fusionados (Main + Secondary).
   * Es la operación más costosa — hace lectura de ambas sheets.
   */
  getAll(filter?: LeadFilter): Promise<Lead[]>;

  /**
   * Devuelve un lead por su contactId.
   */
  getById(contactId: string): Promise<Lead | null>;

  /**
   * Actualiza el estado de un lead en Secondary sheet.
   * Solo escribe los campos que cambiaron.
   */
  updateState(contactId: string, state: Partial<Lead['state']>): Promise<void>;

  /**
   * Sincroniza registros de Main → Secondary:
   * - Agrega filas nuevas que están en Main pero no en Secondary
   * - Asigna ContactId a las que no lo tienen
   */
  sync(): Promise<{ added: number; updated: number }>;
}
