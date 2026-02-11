import pool from '../src/lib/db';

(async function(){
  try {
    const res = await (pool as any).query("SELECT * FROM escopos ORDER BY created_at DESC LIMIT 20");
    const rows = res.rows || [];
    const htmlParts: string[] = [];
    htmlParts.push('<!doctype html>');
    htmlParts.push('<html><head><meta charset="utf-8"><title>Gestão de Escopos - Preview</title></head><body style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif; padding:20px">');
    htmlParts.push('<h1>Gestão de Escopos (preview)</h1>');
    if (!rows.length) {
      htmlParts.push('<p>Nenhum escopo encontrado.</p>');
    } else {
      htmlParts.push('<div style="display:flex;flex-direction:column;gap:12px;max-width:900px">');
      for (const e of rows) {
        htmlParts.push('<div style="border:1px solid #ddd;padding:12px;border-radius:8px">');
        htmlParts.push(`<div style="display:flex;justify-content:space-between;align-items:center"><strong style="font-size:16px">${escapeHtml(e.title||'—')}</strong><span style="font-size:12px;color:#666">${e.created_at?new Date(e.created_at).toLocaleString():''}</span></div>`);
        htmlParts.push(`<p style="margin:6px 0;color:#444">${escapeHtml(e.description||'')}</p>`);
        htmlParts.push(`<p style="margin:4px 0;color:#666"><strong>Solicitante:</strong> ${escapeHtml(e.requester||'—')} &nbsp; <strong>Loja:</strong> ${escapeHtml(e.store_id||'—')}</p>`);
        htmlParts.push('<details style="margin-top:6px"><summary style="cursor:pointer">Itens / anexos</summary>');
        htmlParts.push('<div style="margin-top:8px">');
        htmlParts.push(`<pre style="white-space:pre-wrap;font-size:13px;background:#f7f7f7;padding:8px;border-radius:6px">Itens: ${escapeHtml(JSON.stringify(e.items||[],null,2))}</pre>`);
        htmlParts.push(`<pre style="white-space:pre-wrap;font-size:13px;background:#f7f7f7;padding:8px;border-radius:6px">Anexos: ${escapeHtml(JSON.stringify(e.attachments||[],null,2))}</pre>`);
        htmlParts.push('</div></details>');
        htmlParts.push('</div>');
      }
      htmlParts.push('</div>');
    }
    htmlParts.push('</body></html>');
    const html = htmlParts.join('\n');
    console.log(html);
    await (pool as any).end();
    process.exit(0);
  } catch (err) {
    console.error('error', (err as any)?.message || err);
    try { await (pool as any).end(); } catch (e) {}
    process.exit(2);
  }

  function escapeHtml(s: any) {
    if (s === null || typeof s === 'undefined') return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
