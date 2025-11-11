import pool from '../src/lib/db';
import { mockIncidents } from '../src/lib/mock-data';

async function main() {
  try {
    console.log('Will insert', mockIncidents.length, 'mock incidents (handling id type)');

    // detect id column type
    const col = await pool.query(
      `SELECT data_type FROM information_schema.columns WHERE table_name='incidents' AND column_name='id' LIMIT 1`
    );
    const idType = (col.rows[0] && col.rows[0].data_type) || 'text';
    const idIsInteger = idType && (idType.indexOf('int') !== -1 || idType === 'integer' || idType === 'bigint');

    let idx = 0;
    for (const inc of mockIncidents) {
      idx++;
      console.log(`Inserting mock incident ${idx}/${mockIncidents.length} id=${inc.id}`);
      const titleVal = (inc as any).itemName || (inc as any).description || 'Incidente de teste';
      const values = [
        titleVal,
        (inc as any).itemName || null,
        (inc as any).location || null,
        (inc as any).description || null,
        (inc as any).lat ?? 0,
        (inc as any).lng ?? 0,
        (inc as any).status || 'Aberto',
        (inc as any).openedAt || null,
      ];

      if (idIsInteger) {
        // Insert without id (let DB assign integer PK). Use ON CONFLICT on a composite key is not feasible here.
        await pool.query(
          `INSERT INTO incidents (title, item_name, location, description, lat, lng, status, opened_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            values
        );
      } else {
        const id = inc.id || `INC-${Math.floor(Math.random() * 100000)}`;
        await pool.query(
            `INSERT INTO incidents (id, title, item_name, location, description, lat, lng, status, opened_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
           ON CONFLICT (id) DO UPDATE SET
             item_name = COALESCE(EXCLUDED.item_name, incidents.item_name),
             location = COALESCE(EXCLUDED.location, incidents.location),
             description = COALESCE(EXCLUDED.description, incidents.description),
             lat = COALESCE(EXCLUDED.lat, incidents.lat),
             lng = COALESCE(EXCLUDED.lng, incidents.lng),
             status = COALESCE(EXCLUDED.status, incidents.status),
             opened_at = COALESCE(EXCLUDED.opened_at, incidents.opened_at)
          `,
            [id, ...values]
        );
      }
    }
    console.log('Insert complete.');
  } catch (err) {
    console.error('seed error', err && (err as any).message ? (err as any).message : err);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch {};
  }
}

main();
