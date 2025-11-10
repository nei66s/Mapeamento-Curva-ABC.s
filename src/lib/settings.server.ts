import pool from './db';

export type UserSettings = {
  userId: string;
  theme?: 'light' | 'dark';
  language?: string;
  density?: string;
  defaultPage?: string;
  notifications?: { incidents?: boolean; compliance?: boolean; reports?: boolean };
};

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      theme TEXT,
      language TEXT,
      density TEXT,
      default_page TEXT,
      notifications JSONB
    )
  `);
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  await ensureTable();
  const res = await pool.query('SELECT * FROM user_settings WHERE user_id = $1 LIMIT 1', [userId]);
  if (res.rowCount === 0) return null;
  const row = res.rows[0];
  return {
    userId: String(row.user_id),
    theme: row.theme || undefined,
    language: row.language || undefined,
    density: row.density || undefined,
    defaultPage: row.default_page || undefined,
    notifications: row.notifications || undefined,
  };
}

export async function upsertUserSettings(userId: string, changes: Omit<UserSettings, 'userId'>): Promise<UserSettings> {
  await ensureTable();
  const current = await getUserSettings(userId);
  const merged = {
    user_id: userId,
    theme: changes.theme ?? current?.theme ?? null,
    language: changes.language ?? current?.language ?? null,
    density: changes.density ?? current?.density ?? null,
    default_page: changes.defaultPage ?? current?.defaultPage ?? null,
    notifications: changes.notifications ?? current?.notifications ?? null,
  };
  const res = await pool.query(
    `INSERT INTO user_settings (user_id, theme, language, density, default_page, notifications)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (user_id) DO UPDATE SET
       theme = EXCLUDED.theme,
       language = EXCLUDED.language,
       density = EXCLUDED.density,
       default_page = EXCLUDED.default_page,
       notifications = EXCLUDED.notifications
     RETURNING *`,
    [merged.user_id, merged.theme, merged.language, merged.density, merged.default_page, merged.notifications]
  );
  const row = res.rows[0];
  return {
    userId: String(row.user_id),
    theme: row.theme || undefined,
    language: row.language || undefined,
    density: row.density || undefined,
    defaultPage: row.default_page || undefined,
    notifications: row.notifications || undefined,
  };
}

