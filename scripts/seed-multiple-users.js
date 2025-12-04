#!/usr/bin/env node
// Seed multiple users, roles, user_roles and user_profile for local dev
// Usage: node scripts/seed-multiple-users.js

const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const cfg = {
    host: process.env.PGHOST || 'localhost',
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'admin',
    database: process.env.PGDATABASE || 'postgres',
  };

  const client = new Client({ ...cfg });
  await client.connect();

  const roles = ['admin', 'gestor', 'regional', 'visualizador', 'usuario'];
  const users = [
    { name: 'Admin', email: 'admin@gmail.com', role: 'admin', password: 'admin' },
    { name: 'Alice Silva', email: 'alice@example.com', role: 'gestor', password: 'password123' },
    { name: 'Bruno Costa', email: 'bruno@example.com', role: 'regional', password: 'password123' },
    { name: 'Carla Souza', email: 'carla@example.com', role: 'visualizador', password: 'password123' },
    { name: 'Diego Lima', email: 'diego@example.com', role: 'usuario', password: 'password123' },
    { name: 'Eduarda Reis', email: 'eduarda@example.com', role: 'usuario', password: 'password123' },
    { name: 'Fábio Gomes', email: 'fabio@example.com', role: 'usuario', password: 'password123' },
    { name: 'Gabriela Pinto', email: 'gabriela@example.com', role: 'gestor', password: 'password123' },
    { name: 'Henrique Moraes', email: 'henrique@example.com', role: 'regional', password: 'password123' },
    { name: 'Isabela Nunes', email: 'isabela@example.com', role: 'visualizador', password: 'password123' }
  ];

  try {
    // Ensure roles exist
    for (const r of roles) {
      const res = await client.query('select id from roles where name = $1 limit 1', [r]);
      if (!res.rowCount) {
        await client.query('insert into roles(id, name) values (gen_random_uuid(), $1)', [r]);
      }
    }

    // Upsert users and assign roles
    for (const u of users) {
      const hashed = await bcrypt.hash(u.password, 10);
      const upsert = `INSERT INTO users (name, email, role, password_hash, created_at) VALUES ($1,$2,$3,$4, now()) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, password_hash = EXCLUDED.password_hash RETURNING id`;
      const r = await client.query(upsert, [u.name, u.email, u.role, hashed]);
      const userId = r.rows[0].id;

      // ensure role id
      const roleRes = await client.query('select id from roles where name = $1 limit 1', [u.role]);
      const roleId = roleRes.rows[0].id;

      // upsert user_roles (avoid duplicates)
      try {
        await client.query('DELETE FROM user_roles WHERE user_id = $1::text AND role_id = $2::text', [String(userId), String(roleId)]);
        await client.query('INSERT INTO user_roles(user_id, role_id) VALUES ($1, $2)', [String(userId), String(roleId)]);
      } catch (e) {
        // ignore
      }

      // add a simple profile
      try {
        await client.query('INSERT INTO user_profile(user_id, extra) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET extra = EXCLUDED.extra', [String(userId), { bio: `Conta de ${u.name}` }]);
      } catch (e) {
        // ignore if table missing
      }
      console.log('Upserted', u.email, '->', userId);
    }

    console.log('Seed complete.');
  } catch (e) {
    console.error('Seed failed', e.message || e);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
