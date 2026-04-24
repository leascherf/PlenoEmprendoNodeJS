import { Lead, hasDuplicate, needsFollowUp } from '../../domain/entities/Lead';
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

    return {
      leads,
      total: leads.length,
      withDuplicates: leads.filter(hasDuplicate).length,
      withFollowUp: leads.filter(needsFollowUp).length,
    };
  }
}
