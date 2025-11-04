import pool from './db';
import { stores } from './mock-simple';

/**
 * Create `store_items` join table and populate with sample associations.
 * Run with: npx ts-node src/lib/migrate-store-items.ts
 */
async function migrate() {
  // Create table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store_items (
      id SERIAL PRIMARY KEY,
      store_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      CONSTRAINT fk_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
      CONSTRAINT fk_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      UNIQUE (store_id, item_id)
    );
  `);

  // Fetch existing stores and items
  const storesRes = await pool.query('SELECT id FROM stores');
  const itemsRes = await pool.query('SELECT id FROM items');

  const storeIds = storesRes.rows.map((r: any) => r.id);
  const itemIds = itemsRes.rows.map((r: any) => r.id);

  if (storeIds.length === 0 || itemIds.length === 0) {
    console.log('No stores or items found; ensure you ran other migrations first.');
    await pool.end();
    return;
  }

  // For each item, assign to 1-3 random stores
  for (const itemId of itemIds) {
    const assignCount = Math.max(1, Math.min(3, Math.floor(Math.random() * 4)));
    const shuffled = storeIds.slice().sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, assignCount);
    for (const storeId of selected) {
      try {
        await pool.query(
          'INSERT INTO store_items (store_id, item_id) VALUES ($1, $2) ON CONFLICT (store_id, item_id) DO NOTHING',
          [storeId, itemId]
        );
      } catch (e) {
        console.error('Failed to insert store_items', e);
      }
    }
  }

  console.log('store_items migration complete.');
  await pool.end();
}

migrate().catch(async (e) => {
  console.error('Migration error', e);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});
