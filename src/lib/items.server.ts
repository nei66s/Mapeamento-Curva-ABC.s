import pool from './db';
import type { Item } from './types';

function mapDbItem(row: any): Item {
  const impactFactors = (() => {
    const value = row.impact_factors;
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      return JSON.parse(value);
    } catch (err) {
      return [];
    }
  })();
  return {
    id: String(row.id),
    name: row.name,
    category: row.category || row.category_name || 'Sem Categoria',
    classification: row.classification || 'C',
    storeCount: parseInt(row.store_count || row.storecount || 0, 10) || 0,
    impactFactors,
    status: row.status || 'offline',
    contingencyPlan: row.contingency_plan || '',
    leadTime: row.lead_time || '',
    imageUrl: row.image_url || undefined,
  };
}

export async function listItems(): Promise<Item[]> {
  const res = await pool.query(`
    SELECT 
      i.id, 
      i.name, 
      c.name as category,
      i.classification,
      i.impact_factors,
      i.status,
      i.contingency_plan,
      i.lead_time,
      i.image_url,
      COUNT(DISTINCT si.store_id) as store_count
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN store_items si ON i.id = si.item_id
    GROUP BY i.id, c.name
    ORDER BY i.name ASC
  `);

  return res.rows.map(mapDbItem);
}

export type NewItem = {
  name: string;
  category?: string | null; // category name
  classification?: string | null;
  impactFactors?: string[];
  status?: string;
  contingencyPlan?: string;
  leadTime?: string;
  imageUrl?: string | null;
};

export async function createItem(data: NewItem): Promise<Item> {
  // Resolve category name to id (if provided)
  let categoryId: number | null = null;
  if (data.category) {
    const r = await pool.query('SELECT id FROM categories WHERE name = $1', [data.category]);
    if (r.rows[0]) categoryId = r.rows[0].id;
  }

  const res = await pool.query(
    `INSERT INTO items (name, category_id, classification, impact_factors, status, contingency_plan, lead_time, image_url)
     VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8)
     ON CONFLICT (name) DO UPDATE SET category_id = COALESCE(EXCLUDED.category_id, items.category_id), classification = COALESCE(EXCLUDED.classification, items.classification), impact_factors = COALESCE(EXCLUDED.impact_factors, items.impact_factors), status = COALESCE(EXCLUDED.status, items.status), contingency_plan = COALESCE(EXCLUDED.contingency_plan, items.contingency_plan), lead_time = COALESCE(EXCLUDED.lead_time, items.lead_time), image_url = COALESCE(EXCLUDED.image_url, items.image_url)
     RETURNING id, name, classification, impact_factors, status, contingency_plan, lead_time, image_url, category_id`,
    [
      data.name,
      categoryId,
      data.classification || null,
      JSON.stringify(data.impactFactors || []),
      data.status || 'offline',
      data.contingencyPlan || '',
      data.leadTime || '',
      data.imageUrl || null,
    ]
  );

  const row = res.rows[0];

  // Fetch category name if available
  let categoryName = 'Sem Categoria';
  if (row.category_id) {
    const rc = await pool.query('SELECT name FROM categories WHERE id = $1', [row.category_id]);
    if (rc.rows[0]) categoryName = rc.rows[0].name;
  }

  return {
    ...mapDbItem({ ...row, category: categoryName, store_count: 0 }),
  };
}

export async function createItemsBulk(items: NewItem[]): Promise<Item[]> {
  const created: Item[] = [];
  for (const it of items) {
    const c = await createItem(it);
    created.push(c);
  }
  return created;
}

export async function getItemById(id: string): Promise<Item | null> {
  const res = await pool.query(
    `SELECT i.*, c.name AS category_name,
        (SELECT COUNT(*) FROM store_items si WHERE si.item_id = i.id) AS store_count
     FROM items i
     LEFT JOIN categories c ON c.id = i.category_id
     WHERE i.id = $1`,
    [id]
  );
  if (!res.rows[0]) return null;
  return mapDbItem(res.rows[0]);
}

export async function updateItem(id: string, data: Partial<NewItem>): Promise<Item | null> {
  const sets: string[] = [];
  const params: any[] = [];
  let idx = 1;

  const push = (fragment: string, value?: any) => {
    sets.push(fragment.replace('??', `$${idx++}`));
    if (value !== undefined) params.push(value);
  };

  if (data.name !== undefined) push('name = ??', data.name);
  if (data.category !== undefined) {
    if (data.category) {
      push('category_id = (SELECT id FROM categories WHERE name = ??)', data.category);
    } else {
      sets.push('category_id = NULL');
    }
  }
  if (data.classification !== undefined) push('classification = ??', data.classification);
  if (data.impactFactors !== undefined) push('impact_factors = ??', JSON.stringify(data.impactFactors || []));
  if (data.status !== undefined) push('status = ??', data.status);
  if (data.contingencyPlan !== undefined) push('contingency_plan = ??', data.contingencyPlan);
  if (data.leadTime !== undefined) push('lead_time = ??', data.leadTime);
  if (data.imageUrl !== undefined) push('image_url = ??', data.imageUrl || null);

  if (!sets.length) return getItemById(id);

  params.push(id);
  const res = await pool.query(`UPDATE items SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, params);
  if (!res.rows[0]) return null;
  return getItemById(String(res.rows[0].id));
}

export async function deleteItem(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM items WHERE id = $1', [id]);
  return res.rowCount > 0;
}
