import type { Category } from './types';
import pool from './db';

export async function listCategories(): Promise<Category[]> {
  const res = await pool.query(`
    SELECT 
      c.id,
      c.name,
      c.description,
      c.image_url,
      c.classification,
      COUNT(i.id) as item_count,
      -- compute average classification mapped to numeric score: A=10, B=5, C=1
      COALESCE(ROUND(AVG(CASE WHEN i.classification = 'A' THEN 10 WHEN i.classification = 'B' THEN 5 ELSE 1 END))::int, 0) as risk_index
    FROM categories c
    LEFT JOIN items i ON c.id = i.category_id
    GROUP BY c.id
    ORDER BY c.name ASC
  `);

  return res.rows.map((row: any) => ({
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    classification: (row.classification as any) || 'C',
    imageUrl: row.image_url || undefined,
    itemCount: parseInt(row.item_count) || 0,
    riskIndex: parseInt(row.risk_index) || 0,
  }));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const res = await pool.query(`
    SELECT id, name, description, image_url, classification
    FROM categories
    WHERE id = $1
  `, [id]);
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    classification: row.classification || 'C',
    imageUrl: row.image_url || undefined,
    itemCount: 0,
    riskIndex: 0,
  };
}

export type NewCategory = Omit<Category, 'id' | 'itemCount' | 'riskIndex'>;

export async function createCategory(cat: NewCategory): Promise<Category> {
  const res = await pool.query(
    `INSERT INTO categories (name, description, image_url, classification)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, image_url = EXCLUDED.image_url, classification = EXCLUDED.classification
     RETURNING id, name, description, image_url, classification`,
    [cat.name, cat.description || '', cat.imageUrl || null, cat.classification || 'C']
  );
  const row = res.rows[0];
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    classification: row.classification || 'C',
    imageUrl: row.image_url || undefined,
    itemCount: 0,
    riskIndex: 0,
  };
}

export async function createCategoriesBulk(categories: NewCategory[]): Promise<Category[]> {
  const created: Category[] = [];
  for (const c of categories) {
    const cat = await createCategory(c);
    created.push(cat);
  }
  return created;
}

export async function updateCategory(id: string, cat: Partial<NewCategory>): Promise<Category | null> {
  const res = await pool.query(
    `UPDATE categories SET name = COALESCE($1, name), description = COALESCE($2, description), image_url = COALESCE($3, image_url), classification = COALESCE($4, classification)
     WHERE id = $5 RETURNING id, name, description, image_url, classification`,
    [cat.name || null, cat.description || null, cat.imageUrl || null, cat.classification || null, id]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    name: row.name,
    description: row.description || '',
    classification: row.classification || 'C',
    imageUrl: row.image_url || undefined,
    itemCount: 0,
    riskIndex: 0,
  };
}

export async function deleteCategory(id: string): Promise<boolean> {
  const res = await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  return res.rowCount > 0;
}
