// ─────────────────────────────────────────────
//  USE CASE: UpdateLeadStateUseCase
//  Valida y persiste cambios en el estado de un lead.
//  Aplica reglas de negocio antes de guardar.
// ─────────────────────────────────────────────

import { Lead, LeadState } from '../../domain/entities/Lead';
import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

export interface UpdateLeadStateInput {
  contactId: string;
  changes: Partial<LeadState>;
}

export interface UpdateLeadStateOutput {
  success: boolean;
  lead: Lead | null;
  errors: string[];
}

export class UpdateLeadStateUseCase {
  constructor(private readonly leadRepo: ILeadRepository) {}

  async execute(input: UpdateLeadStateInput): Promise<UpdateLeadStateOutput> {
    const errors: string[] = [];

    // ── Reglas de negocio ────────────────────────────────────────────

    // No se puede desmarcar pasoACloser si ya tiene fecha
    if (
      input.changes.pasoACloser === false &&
      input.changes.fechaPasoACloser !== null
    ) {
      input.changes.fechaPasoACloser = null;
    }

    // Si se marca whatsappEnviado por primera vez, registrar fecha
    if (input.changes.whatsappEnviado === true) {
      const lead = await this.leadRepo.getById(input.contactId);
      if (lead && !lead.state.whatsappEnviado) {
        input.changes.ultimaActualizacion = new Date();
      }
    }

    // Si se marca pasoACloser, registrar fecha si no tiene
    if (input.changes.pasoACloser === true && !input.changes.fechaPasoACloser) {
      const lead = await this.leadRepo.getById(input.contactId);
      if (lead && !lead.state.fechaPasoACloser) {
        input.changes.fechaPasoACloser = new Date();
      }
    }

    // Siempre actualizar ultimaActualizacion al guardar
    input.changes.ultimaActualizacion = new Date();

    // ── Persistir ────────────────────────────────────────────────────
    if (errors.length > 0) {
      return { success: false, lead: null, errors };
    }

    try {
      await this.leadRepo.updateState(input.contactId, input.changes);
      const updated = await this.leadRepo.getById(input.contactId);
      return { success: true, lead: updated, errors: [] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, lead: null, errors: [message] };
    }
  }
}
