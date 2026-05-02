// ─────────────────────────────────────────────
//  Script de migración única: Sheet secundario → MariaDB
//  Leer el Sheet de seguimiento (que era el "secondary") con
//  la Service Account y volcar todos los leads a la tabla `leads`.
//
//  Uso: npx tsx scripts/migrateFromSheets.ts
//  Ejecutar UNA SOLA VEZ antes de poner en producción.
// ─────────────────────────────────────────────

import 'dotenv/config';
import mysql from 'mysql2/promise';
import { loadConfig } from '../src/infrastructure/config/config';
import { SheetReader } from '../src/infrastructure/google/SheetReader';
import { LeadMapper, normalizePhone } from '../src/infrastructure/google/LeadMapper';
import { stateToDbColumns } from '../src/infrastructure/persistence/mysql/MariaDbLeadMapper';

// Sheet secundario: pasar el ID como argumento o hardcodearlo aquí
const SECONDARY_SHEET_ID = process.env.SHEET_SECONDARY_ID ?? '';
const SECONDARY_GID = process.env.SHEET_SECONDARY_GID ?? '0';
const SECONDARY_HEADER_ROW = parseInt(process.env.SHEET_SECONDARY_HEADER_ROW ?? '2', 10);

async function main(): Promise<void> {
  if (!SECONDARY_SHEET_ID) {
    console.error('✗ Definí SHEET_SECONDARY_ID en el .env para correr la migración');
    process.exit(1);
  }

  const config = loadConfig();

  const pool = await mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  });

  const reader = new SheetReader(config.googleServiceAccountKey);

  console.log('→ Leyendo Sheet secundario...');
  const rows = await reader.getRawRows(SECONDARY_SHEET_ID, SECONDARY_GID, SECONDARY_HEADER_ROW);
  console.log(`   ${rows.length} filas encontradas`);

  const mapper = new LeadMapper(config.mainSheet, config.mainSheet);

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const lead = mapper.fromMergedRow(row);
    const contactId = lead.info.contactId;

    if (!contactId) {
      skipped++;
      continue;
    }

    const stateCols = stateToDbColumns(lead.state);

    try {
      await pool.execute(
        `INSERT IGNORE INTO leads
          (contact_id, nombre, telefono, telefono_normalizado, email, closer,
           fecha_agendado, estado_lead, source,
           ${Object.keys(stateCols).join(', ')})
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'secondary', ${Object.keys(stateCols).map(() => '?').join(', ')})`,
        [
          contactId,
          lead.info.nombre,
          lead.info.telefono,
          normalizePhone(lead.info.telefono),
          lead.info.email,
          lead.info.closer,
          lead.info.fechaAgendado?.toISOString().slice(0, 19).replace('T', ' ') ?? null,
          lead.state.estadoLead || 'Lead Iniciado',
          ...Object.values(stateCols),
        ]
      );
      inserted++;
    } catch (err) {
      console.warn(`⚠ Fila ${contactId} no importada:`, err instanceof Error ? err.message : err);
      skipped++;
    }
  }

  await pool.end();

  console.log(`\n✓ Migración completada:`);
  console.log(`   Insertados: ${inserted}`);
  console.log(`   Omitidos:   ${skipped}`);
}

main().catch(err => {
  console.error('✗ Error en migración:', err.message ?? err);
  process.exit(1);
});
