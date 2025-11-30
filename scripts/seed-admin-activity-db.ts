// import DB pool (use relative path to work under ts-node)
import pool from '../src/lib/db';

async function run() {
  try {
    console.log('Seeding recent admin activity into DB...');

    // Find some known users by email (adjust if emails differ)
    const emails = ['helena.ramos@empresa.com', 'marcos.silva@empresa.com', 'demo.a@demo.local'];
    const users: { id: string; email: string }[] = [];
    for (const e of emails) {
      const r = await pool.query('select id, email from users where email = $1 limit 1', [e]);
      if (r.rowCount) users.push(r.rows[0]);
    }

    if (!users.length) {
      console.warn('No matching users found in DB for seeded emails. Skipping audit inserts.');
      return process.exit(0);
    }

    // Insert recent login audit entries for each found user
    const now = new Date();
    const inserts: Array<Promise<any>> = [];
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      const ts1 = new Date(now.getTime() - (i + 1) * 2 * 60 * 1000).toISOString();
      inserts.push(pool.query(
        `insert into audit_logs(user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [u.id, 'user', u.id, 'user.login', JSON.stringify({}), JSON.stringify({ status: 'active' }), '127.0.0.1', 'Seeder/1.0', ts1]
      ));
    }

    // Add a couple of administrative actions
    // insert a module config update referencing an existing user (to satisfy FK), fallback to first found user
    if (users.length) {
      inserts.push(pool.query(
        `insert into audit_logs(user_id, entity, entity_id, action, before_data, after_data, ip, user_agent, created_at)
         values ($1, 'module', 'admin-analytics', 'config.update', $2, $3, $4, $5, $6)`,
        [users[0].id, JSON.stringify({ tracking: true }), JSON.stringify({ tracking: false }), '127.0.0.1', 'Seeder/1.0', new Date().toISOString()]
      ));
    }

    await Promise.all(inserts);
    console.log('Seeded audit_logs successfully.');
  } catch (e) {
    console.error('Error seeding admin activity:', e);
  } finally {
    await pool.end();
  }
}

run();
