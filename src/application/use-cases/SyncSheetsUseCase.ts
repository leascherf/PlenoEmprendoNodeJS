// ─────────────────────────────────────────────
//  USE CASE: SyncSheetsUseCase
//  Dispara la sincronización Main → Secondary.
//  Equivale al botón "Recargar" del WinForms.
// ─────────────────────────────────────────────

import { ILeadRepository } from '../../domain/repositories/ILeadRepository';

export interface SyncSheetsOutput {
  success: boolean;
  added: number;
  updated: number;
  error?: string;
}

export class SyncSheetsUseCase {
  constructor(private readonly leadRepo: ILeadRepository) {}

  async execute(): Promise<SyncSheetsOutput> {
    try {
      const result = await this.leadRepo.sync();
      return {
        success: true,
        added: result.added,
        updated: result.updated,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error en sincronización';
      return {
        success: false,
        added: 0,
        updated: 0,
        error: message,
      };
    }
  }
}
