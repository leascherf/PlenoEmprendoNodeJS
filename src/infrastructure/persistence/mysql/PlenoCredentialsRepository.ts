import { Pool } from 'mysql2/promise';

// Almacena un único hash bcrypt para la contraseña del panel.
// Mismo patrón que la app de Luciana: delete + insert para garantizar
// que nunca haya más de una fila.
export class PlenoCredentialsRepository {
  constructor(private readonly pool: Pool) {}

  async getHash(): Promise<string | null> {
    const [rows] = await this.pool.execute<any[]>(
      'SELECT password_hash FROM pleno_credentials ORDER BY id DESC LIMIT 1'
    );
    return rows[0]?.password_hash ?? null;
  }

  async setHash(hash: string): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('DELETE FROM pleno_credentials');
      await conn.execute('INSERT INTO pleno_credentials (password_hash) VALUES (?)', [hash]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}
