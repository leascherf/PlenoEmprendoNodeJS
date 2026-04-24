import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

export interface SyncSheetsOutput {
  success: boolean;
  added: number;
  skipped: number; // leads que ya existían en Secondary y no fueron tocados
  error?: string;
}

export class SyncSheetsUseCase {
  constructor(private readonly leadRepo: ILeadRepository) {}

  async execute(): Promise<SyncSheetsOutput> {
    try {
      const result = await this.leadRepo.sync();
      return { success: true, added: result.added, skipped: result.skipped };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en sincronización';
      return { success: false, added: 0, skipped: 0, error: message };
    }
  }
}
