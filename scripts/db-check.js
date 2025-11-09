const { Client } = require('pg');

async function run() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE || 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to Postgres');

    try {
      const r1 = await client.query('SELECT 1 as ok');
      console.log('SELECT 1 ->', r1.rows[0]);
    } catch (e) {
      console.error('SELECT 1 failed', e.message);
    }

    try {
      const r2 = await client.query('SELECT data FROM indicators ORDER BY mes');
      console.log('indicators rows:', r2.rowCount);
    } catch (e) {
      console.error('Query indicators failed:', e.message);
    }

    const aggSql = `
      SELECT to_char(data_lancamento, 'YYYY-MM') as mes,
             count(*) as total,
             count(*) FILTER (WHERE status = 'PAGO') as pagos,
             count(*) FILTER (WHERE status = 'PENDENTE') as pendentes,
             coalesce(sum(valor),0) as soma_valor
      FROM public.indicadores_lancamentos
      GROUP BY mes
      ORDER BY mes;
    `;

    try {
      const a = await client.query(aggSql);
      console.log('aggregation rows:', a.rowCount);
    } catch (e) {
      console.error('Aggregation query failed:', e.message);
    }

  } catch (err) {
    console.error('DB connect failed:', err.message);
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

run().catch(e=>{ console.error('fatal', e); process.exit(2); });
