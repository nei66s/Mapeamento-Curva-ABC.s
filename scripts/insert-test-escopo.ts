import pool from '../src/lib/db';

(async function(){
  try {
    const title = 'Teste Lançar - automático';
    const description = 'Escopo criado por teste automático';
    const norms = { steps: ['passo1', 'passo2'] };
    const requester = 'Tester';
    const store_id = null; // optional
    const items = [{ title: 'item A', description: 'descrição do item A' }];
    const attachments = [{ url: '/uploads/test.png', name: 'test.png' }];
    const created_by = '11111111-1111-1111-1111-111111111111';

    const res = await (pool as any).query(
      `INSERT INTO escopos(title, description, norms, requester, store_id, items, attachments, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [title, description, JSON.stringify(norms), requester, store_id, JSON.stringify(items), JSON.stringify(attachments), created_by]
    );

    console.log('Inserted escopo:', res.rows[0]);
    await (pool as any).end();
    process.exit(0);
  } catch (err) {
    console.error('insert error', (err as any)?.message || err);
    try { await (pool as any).end(); } catch (e) {}
    process.exit(2);
  }
})();
