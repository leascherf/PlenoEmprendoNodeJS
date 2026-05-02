import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { loadConfig } from '../src/infrastructure/config/config';

async function main(): Promise<void> {
  const config = loadConfig();
  const schemaPath = path.join(__dirname, '..', 'src', 'infrastructure', 'persistence', 'mysql', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    console.log('✓ Schema aplicado correctamente en', config.db.database);
  } finally {
    await conn.end();
  }
}

main().catch((err: Error) => {
  console.error('✗ Error aplicando schema:', err.message);
  process.exit(1);
});
