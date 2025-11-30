import pool from '../src/lib/db';

async function main(){
  try{
    const value = {
      widgets: [
        { id: 'w1', type: 'indicators', title: 'Resumo de Indicadores', position: { x: 0, y: 0 }, size: { w: 6, h: 4 }, config: { period: '30d' } },
        { id: 'w2', type: 'admin-users', title: 'Usuários Ativos', position: { x: 6, y: 0 }, size: { w: 6, h: 4 }, config: { showInactive: false } },
        { id: 'w3', type: 'admin-analytics', title: 'Analytics (Exemplo)', position: { x: 0, y: 4 }, size: { w: 12, h: 6 }, config: { realtime: false } },
        { id: 'w4', type: 'reports', title: 'Relatórios Recentes', position: { x: 0, y: 10 }, size: { w: 12, h: 3 }, config: { limit: 5 } }
      ],
      layout: 'grid'
    };

    await pool.query(
      "INSERT INTO admin_dashboard_settings(key, value) VALUES($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      ['dashboard_widgets', JSON.stringify(value)]
    );

    const sel = await pool.query("select key, value from admin_dashboard_settings where key = $1 limit 1", ['dashboard_widgets']);
    if (sel.rowCount) {
      console.log('Inserted dashboard_widgets:', sel.rows[0].value);
    } else {
      console.log('dashboard_widgets not found after insert');
    }

  }catch(e){
    console.error('seed-admin-settings error', e && (e as any).message ? (e as any).message : e);
  } finally {
    await pool.end();
  }
}

main();
