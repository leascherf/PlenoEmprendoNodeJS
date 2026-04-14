// ─────────────────────────────────────────────
//  USE CASE: GetLeadsUseCase
//  Orquesta la obtención de leads con filtros.
//  Solo habla con interfaces del dominio.
// ─────────────────────────────────────────────

import { Lead } from '../../domain/entities/Lead';
import { ILeadRepository, LeadFilter } from '../../domain/repositories/ILeadRepository';

export interface GetLeadsInput {
  filter?: LeadFilter;
}

export interface GetLeadsOutput {
  leads: Lead[];
  total: number;
  withDuplicates: number;
  withFollowUp: number;
}

export class GetLeadsUseCase {
  constructor(private readonly leadRepo: ILeadRepository) {}

  async execute(input: GetLeadsInput = {}): Promise<GetLeadsOutput> {
    const leads = await this.leadRepo.getAll(input.filter);

    const withDuplicates = leads.filter(
      (l) => l.state.posibleDuplicado && !l.state.duplicadoChequeado
    ).length;

    const withFollowUp = leads.filter(
      (l) => l.state.estadoLead === 'Link Enviado: Seguimiento'
    ).length;

    return {
      leads,
      total: leads.length,
      withDuplicates,
      withFollowUp,
    };
  }
}
