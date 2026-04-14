// ─────────────────────────────────────────────
//  INFRASTRUCTURE: GoogleSheetsRepository
//  Implementa ILeadRepository usando Google Sheets API.
//  Es el único lugar que sabe que los datos vienen de Google.
//  Equivale a GoogleLeadSyncService.cs del WinForms.
// ─────────────────────────────────────────────

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Lead, LeadState } from '../../domain/entities/Lead';
import { ILeadRepository, LeadFilter } from '../../domain/repositories/ILeadRepository';
import { SheetsConfig } from '../config/sheets';
import { LeadMapper, RawRow, normalizePhone } from './LeadMapper';
import { v4 as uuidv4 } from 'uuid';

export class GoogleSheetsRepository implements ILeadRepository {
  private readonly mapper: LeadMapper;

  // Cache en memoria para reducir llamadas a la API
  private cache: { leads: Lead[]; fetchedAt: Date } | null = null;
  private readonly CACHE_TTL_MS = 60_000; // 1 minuto

  constructor(
    private readonly auth: OAuth2Client,
    private readonly config: SheetsConfig
  ) {
    this.mapper = new LeadMapper(config.main, config.secondary);
  }

  // ── ILeadRepository ───────────────────────────────────────────────

  async getAll(filter?: LeadFilter): Promise<Lead[]> {
    const leads = await this.loadMerged();
    return this.applyFilter(leads, filter);
  }

  async getById(contactId: string): Promise<Lead | null> {
    const leads = await this.loadMerged();
    return leads.find((l) => l.info.contactId === contactId) ?? null;
  }

  async updateState(contactId: string, changes: Partial<LeadState>): Promise<void> {
    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    const cfg = this.config.secondary;

    const sheetTitle = await this.resolveSheetTitle(cfg.sheetId, cfg.gid);

    // Cargar filas y headers en una sola llamada
    const allRows = await this.getRawRows(cfg.sheetId, cfg.gid, cfg.headerRowNumber);
    const rowIndex = allRows.findIndex((r) => r[cfg.contactIdColumn] === contactId);

    if (rowIndex === -1) {
      throw new Error(`Lead con ContactId ${contactId} no encontrado en Secondary`);
    }

    const headers = Object.keys(allRows[0] ?? {});
    const sheetRow = this.mapper.stateToSheetRow(changes);

    const requests = Object.entries(sheetRow)
      .map(([colName, value]) => {
        const colIndex = headers.indexOf(colName);
        if (colIndex === -1) return null;

        // rowIndex es 0-based respecto a los datos; sumar filas de header + 1 para obtener fila real
        const sheetRowNum = cfg.headerRowNumber + rowIndex + 1;
        const colLetter = columnToLetter(colIndex);
        const range = `'${sheetTitle}'!${colLetter}${sheetRowNum}`;

        return sheets.spreadsheets.values.update({
          spreadsheetId: cfg.sheetId,
          range,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: [[value]] },
        });
      })
      .filter(Boolean);

    await Promise.all(requests);
    this.cache = null;
  }

  async sync(): Promise<{ added: number; updated: number }> {
    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    const mainCfg = this.config.main;
    const secCfg = this.config.secondary;

    // Cargar ambas sheets
    const [mainRows, secRows] = await Promise.all([
      this.getRawRows(mainCfg.sheetId, mainCfg.gid, mainCfg.headerRowNumber),
      this.getRawRows(secCfg.sheetId, secCfg.gid, secCfg.headerRowNumber),
    ]);

    // Índice de Secondary por ContactId y por teléfono normalizado
    const secByContactId = new Map(
      secRows.map((r) => [r[secCfg.contactIdColumn], r])
    );
    const secByPhone = new Map(
      secRows.map((r) => [normalizePhone(r[secCfg.phoneColumn] ?? ''), r])
    );

    let added = 0;
    let updated = 0;
    const newRows: string[][] = [];

    for (const mainRow of mainRows) {
      const phone = normalizePhone(mainRow[mainCfg.phoneColumn] ?? '');
      const existsInSec = secByContactId.has(mainRow[mainCfg.contactIdColumn])
        || secByPhone.has(phone);

      if (!existsInSec) {
        // Asignar ContactId si no tiene
        const contactId = mainRow[mainCfg.contactIdColumn] || uuidv4();

        // Construir fila para Secondary según targetColumns
        const newRow = (secCfg.targetColumns ?? []).map((col) => {
          if (col === secCfg.contactIdColumn) return contactId;
          if (col === 'Nombre y Apellido Lead') {
            const n = mainRow[mainCfg.nameColumn] ?? '';
            const a = mainRow[mainCfg.lastNameColumn] ?? '';
            return `${n} ${a}`.trim();
          }
          if (col === secCfg.phoneColumn) return mainRow[mainCfg.phoneColumn] ?? '';
          if (col === 'Email') return mainRow[mainCfg.emailColumn] ?? '';
          if (col === 'Closer') return mainRow[mainCfg.closerColumn] ?? '';
          if (col === 'Estado Lead') return 'LEAD INICIADO';
          if (col === 'Fecha Inicio Lead') return mainRow[mainCfg.dateColumn] ?? '';
          return '';
        });

        newRows.push(newRow);
        added++;
      } else {
        updated++;
      }
    }

    // Append nuevas filas a Secondary (usar nombre de hoja para no escribir en la primera por defecto)
    if (newRows.length > 0) {
      const secSheetTitle = await this.resolveSheetTitle(secCfg.sheetId, secCfg.gid);
      await sheets.spreadsheets.values.append({
        spreadsheetId: secCfg.sheetId,
        range: `'${secSheetTitle}'!A1`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: newRows },
      });
    }

    // Invalidar cache
    this.cache = null;

    return { added, updated };
  }

  // ── Privados ──────────────────────────────────────────────────────

  private async loadMerged(): Promise<Lead[]> {
    // Usar cache si es fresco
    if (this.cache && Date.now() - this.cache.fetchedAt.getTime() < this.CACHE_TTL_MS) {
      return this.cache.leads;
    }

    const mainCfg = this.config.main;
    const secCfg = this.config.secondary;

    const [mainRows, secRows] = await Promise.all([
      this.getRawRows(mainCfg.sheetId, mainCfg.gid, mainCfg.headerRowNumber),
      this.getRawRows(secCfg.sheetId, secCfg.gid, secCfg.headerRowNumber),
    ]);

    // Contar ocurrencias de teléfono en Secondary para detectar duplicados
    const phoneCounts = new Map<string, number>();
    for (const row of secRows) {
      const p = normalizePhone(row[secCfg.phoneColumn] ?? '');
      if (p) phoneCounts.set(p, (phoneCounts.get(p) ?? 0) + 1);
    }

    // Indexar Secondary por ContactId
    const secByContactId = new Map<string, RawRow>();
    const secByPhone = new Map<string, RawRow>();
    for (const row of secRows) {
      const id = row[secCfg.contactIdColumn];
      if (id) secByContactId.set(id, row);
      const p = normalizePhone(row[secCfg.phoneColumn] ?? '');
      if (p) secByPhone.set(p, row);
    }

    // Mergear Main + Secondary
    const leads: Lead[] = [];
    for (const mainRow of mainRows) {
      const contactId = mainRow[mainCfg.contactIdColumn];
      const phone = normalizePhone(mainRow[mainCfg.phoneColumn] ?? '');

      const secRow = secByContactId.get(contactId) ?? secByPhone.get(phone) ?? {};
      const merged: RawRow = { ...mainRow, ...secRow };

      // Marcar posible duplicado
      if ((phoneCounts.get(phone) ?? 0) > 1) {
        merged['Posible Duplicado'] = 'TRUE';
      }

      leads.push(this.mapper.fromMergedRow(merged));
    }

    this.cache = { leads, fetchedAt: new Date() };
    return leads;
  }

  private async getRawRows(
    spreadsheetId: string,
    gid: string,
    headerRow: number
  ): Promise<RawRow[]> {
    const sheets = google.sheets({ version: 'v4', auth: this.auth });

    // Obtener título de la hoja por gid
    const sheetTitle = await this.resolveSheetTitle(spreadsheetId, gid);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTitle}`,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const values = response.data.values ?? [];
    if (values.length < headerRow) return [];

    const headers = (values[headerRow - 1] ?? []).map(String);
    return values.slice(headerRow).map((row) => {
      const obj: RawRow = {};
      headers.forEach((h, i) => {
        obj[h] = String(row[i] ?? '');
      });
      return obj;
    });
  }

  private async getHeaders(
    spreadsheetId: string,
    gid: string,
    headerRow: number
  ): Promise<string[]> {
    const rows = await this.getRawRows(spreadsheetId, gid, headerRow);
    return rows.length > 0 ? Object.keys(rows[0]) : [];
  }

  private sheetTitleCache = new Map<string, string>();

  private async resolveSheetTitle(spreadsheetId: string, gid: string): Promise<string> {
    const key = `${spreadsheetId}:${gid}`;
    if (this.sheetTitleCache.has(key)) return this.sheetTitleCache.get(key)!;

    const sheets = google.sheets({ version: 'v4', auth: this.auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find(
      (s) => String(s.properties?.sheetId) === gid
    );
    const title = sheet?.properties?.title ?? 'Sheet1';
    this.sheetTitleCache.set(key, title);
    return title;
  }

  private applyFilter(leads: Lead[], filter?: LeadFilter): Lead[] {
    if (!filter) return leads;
    let result = leads;

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(
        (l) =>
          l.info.nombre.toLowerCase().includes(q) ||
          l.info.telefono.includes(q) ||
          l.info.email.toLowerCase().includes(q)
      );
    }

    if (filter.estadoLead) {
      result = result.filter((l) => l.state.estadoLead === filter.estadoLead);
    }

    if (filter.closer) {
      result = result.filter((l) =>
        l.info.closer.toLowerCase().includes(filter.closer!.toLowerCase())
      );
    }

    if (filter.soloConDuplicados) {
      result = result.filter((l) => l.state.posibleDuplicado && !l.state.duplicadoChequeado);
    }

    if (filter.soloConSeguimiento) {
      result = result.filter((l) => l.state.estadoLead === 'Link Enviado: Seguimiento');
    }

    if (filter.limit) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────

function columnToLetter(index: number): string {
  let letter = '';
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}
