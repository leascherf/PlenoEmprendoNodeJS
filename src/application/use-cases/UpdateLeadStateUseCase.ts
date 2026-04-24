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
    // Trabajar sobre una copia para no mutar el objeto del caller.
    const changes: Partial<LeadState> = { ...input.changes };

    // ── Reglas de negocio ────────────────────────────────────────────

    // Si se desmarca pasoACloser, limpiar la fecha asociada.
    if (changes.pasoACloser === false) {
      changes.fechaPasoACloser = null;
    }

    // Si se marca pasoACloser y aún no tiene fecha, asignar la actual.
    if (changes.pasoACloser === true && !changes.fechaPasoACloser) {
      const lead = await this.leadRepo.getById(input.contactId);
      if (lead && !lead.state.fechaPasoACloser) {
        changes.fechaPasoACloser = new Date();
      }
    }

    // Siempre registrar la última actualización.
    changes.ultimaActualizacion = new Date();

    // ── Persistir ────────────────────────────────────────────────────
    try {
      await this.leadRepo.updateState(input.contactId, changes);
      const updated = await this.leadRepo.getById(input.contactId);
      return { success: true, lead: updated, errors: [] };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      return { success: false, lead: null, errors: [message] };
    }
  }
}
