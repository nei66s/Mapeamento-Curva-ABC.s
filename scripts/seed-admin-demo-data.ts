import pool from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function insertUser(name: string, email: string, role: string, password = 'DemoPass123!') {
  const hash = bcrypt.hashSync(password, 10);
  const q = 'INSERT INTO users(name,email,password_hash,role,created_at) VALUES($1,$2,$3,$4, now()) RETURNING id, name, email, role';
  try {
    const res = await pool.query(q, [name, email, hash, role]);
    return res.rows[0];
  } catch (e) {
    // If user exists, try to select it
    const sel = await pool.query('select id, name, email, role from users where email = $1 limit 1', [email]);
    return sel.rowCount ? sel.rows[0] : null;
  }
}

async function insertTracking(userId: string | null, route: string, device = 'Web', browser = 'Chrome', when?: Date) {
  const q = 'insert into tracking_events(user_id, route, device, browser, created_at) values ($1,$2,$3,$4,$5) returning id';
  const ts = when ? when.toISOString() : new Date().toISOString();
  const res = await pool.query(q, [userId, route, device, browser, ts]);
  return res.rows[0];
}

async function main(){
  try{
    console.log('Seeding demo users...');
    const u1 = await insertUser('Demo Usuario A', 'demo.a@demo.local', 'usuario');
    const u2 = await insertUser('Demo Usuario B', 'demo.b@demo.local', 'usuario');
    const u3 = await insertUser('Demo Gestor', 'demo.gestor@demo.local', 'gestor');
    console.log('Inserted/Found users:', u1?.email, u2?.email, u3?.email);

    console.log('Seeding tracking events...');
    const routes = ['/indicators', '/admin-panel', '/admin-panel/analytics', '/admin-panel/users', '/reports'];
    const now = Date.now();
    const events: Array<Promise<any>> = [];
    // generate events across the past 7 days
    for (let i = 0; i < 200; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const minutesAgo = Math.floor(Math.random() * 24 * 60);
      const when = new Date(now - (daysAgo * 24 * 60 + minutesAgo) * 60 * 1000);
      const route = routes[Math.floor(Math.random() * routes.length)];
      const user = [u1, u2, u3][Math.floor(Math.random() * 3)];
      events.push(insertTracking(user ? user.id : null, route, ['Web','iOS','Android'][Math.floor(Math.random()*3)], ['Chrome','Safari','Firefox'][Math.floor(Math.random()*3)], when));
    }
    await Promise.all(events);
    console.log('Inserted tracking events: 200');
  }catch(e){
    console.error('seed-admin-demo-data error', e && (e as any).message ? (e as any).message : e);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
