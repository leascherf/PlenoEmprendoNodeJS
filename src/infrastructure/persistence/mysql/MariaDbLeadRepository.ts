import { Pool } from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import { Lead, LeadState, hasDuplicate, needsFollowUp } from '../../../domain/entities/Lead';
import { ILeadRepository, LeadFilter } from '../../../domain/repositories/ILeadRepository';
import { SheetReader, RawRow } from '../../google/SheetReader';
import { SheetConfig } from '../../config/config';
import { LeadMapper, normalizePhone } from '../../google/LeadMapper';
import { dbRowToLead, stateToDbColumns } from './MariaDbLeadMapper';

// ─────────────────────────────────────────────
//  MariaDbLeadRepository
//  Implementa ILeadRepository usando MariaDB como storage principal.
//  El Sheet principal (Main) se usa solo para sincronización (lectura).
// ─────────────────────────────────────────────

export class MariaDbLeadRepository implements ILeadRepository {
  private readonly mapper: LeadMapper;

  constructor(
    private readonly pool: Pool,
    private readonly sheetReader: SheetReader,
    private readonly mainSheetConfig: SheetConfig
  ) {
    // El LeadMapper original se reutiliza para leer el Sheet principal
    // (fromMainRow). El secondary config no se necesita — pasamos el mismo.
    this.mapper = new LeadMapper(mainSheetConfig, mainSheetConfig);
  }

  // ── ILeadRepository ─────────────────────────────────────────────────

  async getAll(filter?: LeadFilter): Promise<Lead[]> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT * FROM leads ORDER BY created_at DESC'
    );
    let leads = rows.map(dbRowToLead);

    // Detección de duplicados: marcar los que tienen teléfono repetido
    leads = this.markDuplicates(leads);

    return this.applyFilter(leads, filter);
  }

  async getById(contactId: string): Promise<Lead | null> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT * FROM leads WHERE contact_id = ? LIMIT 1',
      [contactId]
    );
    if (!rows[0]) return null;
    return dbRowToLead(rows[0]);
  }

  async updateState(contactId: string, changes: Partial<LeadState>): Promise<void> {
    const cols = stateToDbColumns(changes);
    if (Object.keys(cols).length === 0) return;

    const setClauses = Object.keys(cols).map(k => `${k} = ?`).join(', ');
    const values: unknown[] = [...Object.values(cols), contactId];

    const [result] = await this.pool.execute<any>(
      `UPDATE leads SET ${setClauses} WHERE contact_id = ?`,
      values as any
    );

    if (result.affectedRows === 0) {
      throw new Error(`Lead con ContactId ${contactId} no encontrado`);
    }
  }

  async sync(): Promise<{ added: number; skipped: number }> {
    const cfg = this.mainSheetConfig;

    // Leer Sheet principal con Service Account (solo lectura)
    const mainRows = await this.sheetReader.getRawRows(
      cfg.sheetId,
      cfg.gid,
      cfg.headerRowNumber
    );

    // Cargar contact_ids y teléfonos ya existentes en DB
    const [existingRows] = await this.pool.execute<any[]>(
      'SELECT contact_id, telefono_normalizado FROM leads'
    );
    const existingIds = new Set(existingRows.map((r: any) => r.contact_id as string));
    const existingPhones = new Set(existingRows.map((r: any) => r.telefono_normalizado as string));

    let added = 0;
    let skipped = 0;

    for (const mainRow of mainRows) {
      const phone = normalizePhone(mainRow[cfg.phoneColumn] ?? '');
      const contactId = mainRow[cfg.contactIdColumn] || uuidv4();

      const exists = existingIds.has(contactId) || (phone && existingPhones.has(phone));

      if (exists) {
        skipped++;
        continue;
      }

      const partial = this.mapper.fromMainRow(mainRow);
      const info = partial.info!;

      await this.pool.execute(
        `INSERT INTO leads
          (contact_id, nombre, telefono, telefono_normalizado, email, closer,
           fecha_agendado, estado_lead, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Lead Iniciado', 'secondary')`,
        [
          contactId,
          info.nombre,
          info.telefono,
          normalizePhone(info.telefono),
          info.email,
          info.closer,
          info.fechaAgendado ? info.fechaAgendado.toISOString().slice(0, 19).replace('T', ' ') : null,
        ]
      );

      existingIds.add(contactId);
      if (phone) existingPhones.add(phone);
      added++;
    }

    return { added, skipped };
  }

  // ── Privados ─────────────────────────────────────────────────────────

  private markDuplicates(leads: Lead[]): Lead[] {
    const phoneCounts = new Map<string, number>();
    for (const lead of leads) {
      const p = lead.info.telefonoNormalizado;
      if (p) phoneCounts.set(p, (phoneCounts.get(p) ?? 0) + 1);
    }
    return leads.map(lead => {
      const count = phoneCounts.get(lead.info.telefonoNormalizado) ?? 0;
      if (count > 1 && !lead.state.posibleDuplicado) {
        return { ...lead, state: { ...lead.state, posibleDuplicado: true } };
      }
      return lead;
    });
  }

  private applyFilter(leads: Lead[], filter?: LeadFilter): Lead[] {
    if (!filter) return leads;
    let result = leads;

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        l =>
          l.info.nombre.toLowerCase().includes(q) ||
          l.info.telefono.includes(q) ||
          l.info.email.toLowerCase().includes(q)
      );
    }

    if (filter.estadoLead) {
      result = result.filter(l => l.state.estadoLead === filter.estadoLead);
    }

    if (filter.closer) {
      result = result.filter(l =>
        l.info.closer.toLowerCase().includes(filter.closer!.toLowerCase())
      );
    }

    if (filter.soloConDuplicados) {
      result = result.filter(hasDuplicate);
    }

    if (filter.soloConSeguimiento) {
      result = result.filter(needsFollowUp);
    }

    if (filter.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }
}
