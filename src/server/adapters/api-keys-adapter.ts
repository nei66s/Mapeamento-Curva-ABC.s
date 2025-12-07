import { randomBytes, createHash } from 'crypto';
import pool from '@/lib/db';

type ApiKeyRow = {
  id: number | string;
  user_id: string | null;
  name: string;
  key_hash: string;
  key_prefix: string;
  created_at: Date;
  last_used_at: Date | null;
  expires_at: Date | null;
  owner_name?: string | null;
  owner_email?: string | null;
};

export type ApiKeyRecord = {
  id: string;
  userId?: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  ownerName?: string;
  ownerEmail?: string;
};

const PREFIX_ATTEMPTS = 5;

function mapApiKeyRow(row: ApiKeyRow): ApiKeyRecord {
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  const expiresAt = row.expires_at instanceof Date ? row.expires_at : row.expires_at;
  const lastUsedAt = row.last_used_at instanceof Date ? row.last_used_at : row.last_used_at;
  return {
    id: String(row.id),
    userId: row.user_id ?? undefined,
    name: row.name,
    keyPrefix: row.key_prefix,
    ownerName: row.owner_name ?? undefined,
    ownerEmail: row.owner_email ?? undefined,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
    lastUsedAt: lastUsedAt ? new Date(lastUsedAt).toISOString() : undefined,
  };
}

export async function listApiKeys() {
  const res = await pool.query(
    `SELECT ak.*,
            u.name AS owner_name,
            u.email AS owner_email
     FROM api_keys ak
     LEFT JOIN users u ON u.id::text = ak.user_id::text
     ORDER BY ak.created_at DESC`
  );
  return res.rows.map((row: ApiKeyRow) => mapApiKeyRow(row));
}

export async function createApiKey(args: { userId?: string; name: string; expiresAt?: string | null }) {
  let attempt = 0;
  while (attempt < PREFIX_ATTEMPTS) {
    attempt += 1;
    const prefix = randomBytes(3).toString('hex').toUpperCase();
    const secret = randomBytes(28).toString('hex');
    const key = `${prefix}-${secret}`;
    const hash = createHash('sha256').update(key).digest('hex');
    try {
      const res = await pool.query(
        `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          args.userId ?? null,
          args.name,
          hash,
          prefix,
          args.expiresAt ? new Date(args.expiresAt) : null,
        ]
      );
      const inserted = res.rows[0] as ApiKeyRow;
      let ownerName: string | null | undefined;
      let ownerEmail: string | null | undefined;
      if (args.userId) {
        const ownerRes = await pool.query(
          'SELECT name, email FROM users WHERE id::text = $1 LIMIT 1',
          [args.userId]
        );
        ownerName = ownerRes.rows[0]?.name ?? null;
        ownerEmail = ownerRes.rows[0]?.email ?? null;
      }
      const row: ApiKeyRow = {
        ...inserted,
        owner_name: ownerName,
        owner_email: ownerEmail,
      };
      return { record: mapApiKeyRow(row), secret: key };
    } catch (error: any) {
      if (error?.code === '23505' && error?.constraint && error.constraint.includes('key_prefix')) {
        continue;
      }
      throw error;
    }
  }
  throw new Error('Não foi possível gerar um prefixo de chave único. Tente novamente.');
}

export async function deleteApiKey(id: string) {
  const res = await pool.query('DELETE FROM api_keys WHERE id = $1', [id]);
  return res.rowCount > 0;
}
