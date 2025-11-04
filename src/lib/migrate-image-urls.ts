import pool from './db';
import fs from 'fs';
import path from 'path';

const publicUploads = path.join(process.cwd(), 'public', 'uploads');
const folders = ['avatars', 'categories'];

function fileExistsInFolder(folder: string, filename: string) {
  const p = path.join(publicUploads, folder, filename);
  return fs.existsSync(p);
}

function normalizeUrl(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`;
}

async function getExistingColumn(table: string, candidates: string[]) {
  const res = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
    [table]
  );
  const cols = res.rows.map((r: any) => String(r.column_name));
  for (const c of candidates) {
    if (cols.includes(c)) return c;
  }
  return null;
}

async function migrateUsers(apply: boolean) {
  const col = await getExistingColumn('users', ['avatarUrl', 'avatarurl', 'avatar_url']);
  if (!col) {
    console.log('migrateUsers: no avatar column found on users table, skipping');
    return 0;
  }
  const res = await pool.query(`SELECT id, ${col} FROM users WHERE ${col} IS NOT NULL`);
  const rows = res.rows;
  console.log(`Found ${rows.length} users with avatarUrl`);
  let planned = 0;
  for (const r of rows) {
    const id = r.id;
  const url = r[col] as string;
    if (!url) continue;
    if (url.startsWith('http')) continue; // skip external
    if (!url.includes('/uploads/')) continue;
    const filename = path.basename(url);
    let target: string | null = null;
    for (const f of folders) {
      if (fileExistsInFolder(f, filename)) {
        target = f;
        break;
      }
    }
    if (!target) {
      console.log(`  [SKIP] user ${id} -> file ${filename} not found in uploads`);
      continue;
    }
    const desired = normalizeUrl(target, filename);
    if (url !== desired) {
      planned++;
      console.log(`  [PLAN] user ${id}: ${url} -> ${desired}`);
      if (apply) {
        await pool.query(`UPDATE users SET ${col} = $1 WHERE id = $2`, [desired, id]);
        console.log(`    [APPLIED] updated user ${id}`);
      }
    }
  }
  return planned;
}

async function migrateCategories(apply: boolean) {
  const res = await pool.query('SELECT id, image_url FROM categories WHERE image_url IS NOT NULL');
  const rows = res.rows;
  console.log(`Found ${rows.length} categories with image_url`);
  let planned = 0;
  for (const r of rows) {
    const id = r.id;
    const url = r.image_url as string;
    if (!url) continue;
    if (url.startsWith('http')) continue;
    if (!url.includes('/uploads/')) continue;
    const filename = path.basename(url);
    let target: string | null = null;
    for (const f of folders) {
      if (fileExistsInFolder(f, filename)) {
        target = f;
        break;
      }
    }
    if (!target) {
      console.log(`  [SKIP] category ${id} -> file ${filename} not found in uploads`);
      continue;
    }
    const desired = normalizeUrl(target, filename);
    if (url !== desired) {
      planned++;
      console.log(`  [PLAN] category ${id}: ${url} -> ${desired}`);
      if (apply) {
        await pool.query('UPDATE categories SET image_url = $1 WHERE id = $2', [desired, id]);
        console.log(`    [APPLIED] updated category ${id}`);
      }
    }
  }
  return planned;
}

async function migrateItems(apply: boolean) {
  const res = await pool.query('SELECT id, image_url FROM items WHERE image_url IS NOT NULL');
  const rows = res.rows;
  console.log(`Found ${rows.length} items with image_url`);
  let planned = 0;
  for (const r of rows) {
    const id = r.id;
    const url = r.image_url as string;
    if (!url) continue;
    if (url.startsWith('http')) continue;
    if (!url.includes('/uploads/')) continue;
    const filename = path.basename(url);
    let target: string | null = null;
    for (const f of folders) {
      if (fileExistsInFolder(f, filename)) {
        target = f;
        break;
      }
    }
    if (!target) {
      console.log(`  [SKIP] item ${id} -> file ${filename} not found in uploads`);
      continue;
    }
    const desired = normalizeUrl(target, filename);
    if (url !== desired) {
      planned++;
      console.log(`  [PLAN] item ${id}: ${url} -> ${desired}`);
      if (apply) {
        await pool.query('UPDATE items SET image_url = $1 WHERE id = $2', [desired, id]);
        console.log(`    [APPLIED] updated item ${id}`);
      }
    }
  }
  return planned;
}

async function main() {
  const apply = process.argv.includes('--apply');
  console.log('migrate-image-urls: starting (apply=' + apply + ')');
  try {
    let totalPlanned = 0;
    totalPlanned += await migrateUsers(apply);
    totalPlanned += await migrateCategories(apply);
    totalPlanned += await migrateItems(apply);
    console.log(`Done. Planned updates: ${totalPlanned}. ${apply ? 'Applied.' : 'Dry-run only.'}`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await pool.end();
  }
}

main();
