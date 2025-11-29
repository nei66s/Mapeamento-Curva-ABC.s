import { NextRequest } from 'next/server';
import { recordAudit } from '../_data';
import { isModuleActive, json, parsePagination, getRequestIp } from '../_utils';
import { listUsers, createUser } from '@/server/adapters/users-adapter';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase();
  const status = searchParams.get('status');
  const role = searchParams.get('role');
  const { page, pageSize } = parsePagination(searchParams);
  // Use users-adapter.listUsers with pagination and derive total via count when possible
  const offset = (page - 1) * pageSize;
  const items = await listUsers(pageSize, offset);

  // Apply lightweight filters in-memory for fields that may not exist in DB (status)
  let filtered = items;
  if (email) filtered = filtered.filter((u: any) => (u.email || '').toLowerCase().includes(email));
  if (role) filtered = filtered.filter((u: any) => (String(u.role || '') === role));

  // Try to compute total count using SQL when possible
  let total = filtered.length;
  try {
    const where: string[] = [];
    const vals: any[] = [];
    let idx = 1;
    const colsRes = await pool.query("select column_name from information_schema.columns where table_name='users' and column_name in ('email','role','status')");
    const cols = new Set(colsRes.rows.map((r: any) => r.column_name));
    if (email && cols.has('email')) { where.push(`email ILIKE $${idx++}`); vals.push(`%${email}%`); }
    if (role && cols.has('role')) { where.push(`role = $${idx++}`); vals.push(role); }
    if (status && cols.has('status')) { where.push(`status = $${idx++}`); vals.push(status); }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countRes = await pool.query(`SELECT count(*)::int as c FROM users ${whereClause}`, vals);
    total = (countRes.rows[0] && countRes.rows[0].c) || filtered.length;
  } catch (e) {
    // fallback to filtered length already set
  }

  return json({ items: filtered, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  if (!isModuleActive('admin-users')) return json({ message: 'Módulo de usuários inativo.' }, 403);
  const body = await request.json();
  try {
    let provisionalPassword: string | undefined;
    let passwordHash: string | null = null;
    if (body.password_hash) {
      passwordHash = body.password_hash;
    } else {
      // generate a random provisional password and hash it
      provisionalPassword = randomBytes(9).toString('base64').replace(/\+/g, 'A').replace(/\//g, 'B').slice(0, 12);
      passwordHash = bcrypt.hashSync(provisionalPassword, 10);
    }

    const user = await createUser({ name: body.name, email: body.email, password_hash: passwordHash, role: body.role });
    recordAudit({
      userId: body.actorId || 'u-admin',
      userName: body.actorName || 'Sistema',
      entity: 'user',
      entityId: user.id,
      action: 'user.create',
      before: null,
      after: user,
      ip: getRequestIp(request),
      userAgent: request.headers.get('user-agent') || undefined,
    });
    // Do NOT include provisional password in API response; keep server-side logs only
    return json(user, 201);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('admin-panel/users POST error', err && err.message ? err.message : err, err && err.stack ? err.stack : '');
    // Postgres unique violation (duplicate email)
    if (err && (err.code === '23505' || (err.constraint && String(err.constraint).includes('email')))) {
      return json({ message: 'Email já cadastrado' }, 409);
    }
    return json({ message: (err && err.message) || 'Erro ao criar usuário' }, 500);
  }
}
