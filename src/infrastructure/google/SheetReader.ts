import { google } from 'googleapis';

// ─────────────────────────────────────────────
//  SheetReader: lectura de Google Sheets usando Service Account.
//  Reemplaza el acceso OAuth por credenciales de servidor.
//  Solo lectura — scope spreadsheets.readonly.
// ─────────────────────────────────────────────

export type RawRow = Record<string, string>;

export class SheetReader {
  private readonly googleAuth: InstanceType<typeof google.auth.GoogleAuth>;
  private sheetTitleCache = new Map<string, string>();

  constructor(keyFilePath: string) {
    this.googleAuth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }

  async getRawRows(spreadsheetId: string, gid: string, headerRow: number): Promise<RawRow[]> {
    const auth = await this.googleAuth.getClient();
    // googleapis acepta el cliente directamente como auth
    const sheets = google.sheets({ version: 'v4', auth: auth as any });

    const sheetTitle = await this.resolveSheetTitle(sheets, spreadsheetId, gid);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: sheetTitle,
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

  private async resolveSheetTitle(
    sheets: ReturnType<typeof google.sheets>,
    spreadsheetId: string,
    gid: string
  ): Promise<string> {
    const key = `${spreadsheetId}:${gid}`;
    if (this.sheetTitleCache.has(key)) return this.sheetTitleCache.get(key)!;

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheet = meta.data.sheets?.find(
      (s) => String(s.properties?.sheetId) === gid
    );
    const title = sheet?.properties?.title ?? 'Sheet1';
    this.sheetTitleCache.set(key, title);
    return title;
  }
}
