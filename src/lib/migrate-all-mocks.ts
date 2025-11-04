import pool from './db';
import { stores } from './mock-simple';

async function migrate() {
  // Stores
  for (const store of stores) {
    await pool.query(
      'INSERT INTO stores (name, location) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [store.name, store.city]
    );
  }

  await pool.end();
  console.log('Migração global dos mocks concluída.');
}

migrate().catch(console.error);
