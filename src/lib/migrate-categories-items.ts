import pool from './db';
import { itemNames, itemCategoryMap } from './mock-raw';

const categories = Array.from(new Set(Object.values(itemCategoryMap)));

async function migrate() {
  // Inserir categorias
  const categoryIds: { [key: string]: number } = {};
  for (const name of categories) {
    const res = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id',
      [name]
    );
    // Se a categoria já existe, buscar o id
    let id = res.rows[0]?.id;
    if (!id) {
      const lookup = await pool.query('SELECT id FROM categories WHERE name = $1', [name]);
      id = lookup.rows[0].id;
    }
    categoryIds[name] = id;
    console.log(`Categoria ${name} migrada.`);
  }

  // Inserir itens
  for (const name of itemNames) {
    const categoryName = itemCategoryMap[name];
    const categoryId = categoryIds[categoryName];
    await pool.query(
      'INSERT INTO items (name, category_id) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
      [name, categoryId]
    );
    console.log(`Item ${name} migrado.`);
  }

  await pool.end();
  console.log('Migração de categorias e itens concluída.');
}

migrate().catch(console.error);
