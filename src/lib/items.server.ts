import pool from './db';
import type { Item } from './types';

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

  return res.rows.map((row: any) => ({
    id: String(row.id),
    name: row.name,
    category: row.category || 'Sem Categoria',
    classification: row.classification,
    storeCount: parseInt(row.store_count) || 0,
    impactFactors: row.impact_factors || [],
    status: row.status || 'offline',
    contingencyPlan: row.contingency_plan || '',
    leadTime: row.lead_time || '',
    imageUrl: row.image_url,
  }));
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
    id: String(row.id),
    name: row.name,
    category: categoryName,
    classification: row.classification,
    storeCount: 0,
    impactFactors: row.impact_factors || [],
    status: row.status || 'offline',
    contingencyPlan: row.contingency_plan || '',
    leadTime: row.lead_time || '',
    imageUrl: row.image_url,
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
