import { NextResponse } from 'next/server';

export async function GET() {
  const html = `<!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Solicitar Conta</title>
    <style>
      body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0; padding:0; display:flex; align-items:center; justify-content:center; height:100vh; background:#f8fafc }
      .card { background:#fff; padding:24px; border-radius:8px; box-shadow:0 4px 24px rgba(0,0,0,0.08); width:100%; max-width:520px }
      .field { margin-bottom:12px }
      label { display:block; font-weight:600; margin-bottom:6px }
      input, textarea { width:100%; padding:8px 10px; border:1px solid #e6e9ee; border-radius:6px }
      .actions { display:flex; gap:12px; align-items:center }
      .btn { background:#0369a1; color:#fff; padding:8px 12px; border-radius:6px; border:none }
      .muted { color:#6b7280 }
    </style>
  </head>
  <body>
    <div class="card">
      <h1 style="margin:0 0 12px">Solicitar Conta</h1>
      <p class="muted">Preencha os dados para solicitar acesso. Aguarde aprovação do administrador.</p>
      <form id="ra-form">
        <div class="field">
          <label for="name">Nome</label>
          <input id="name" name="name" required minlength="3" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required />
        </div>
        <div class="field">
          <label for="message">Mensagem (opcional)</label>
          <textarea id="message" name="message" rows="4"></textarea>
        </div>
        <div class="actions">
          <button type="submit" class="btn">Enviar solicitação</button>
          <a href="/login" class="muted">Voltar ao login</a>
        </div>
      </form>
      <div id="result" style="margin-top:12px"></div>
    </div>
    <script>
      (function(){
        const form = document.getElementById('ra-form');
        const result = document.getElementById('result');
        form.addEventListener('submit', async function(e){
          e.preventDefault();
          result.textContent = '';
          const name = document.getElementById('name').value.trim();
          const email = document.getElementById('email').value.trim();
          const message = document.getElementById('message').value.trim();
          if (name.length < 3) { result.textContent = 'Nome deve ter ao menos 3 caracteres.'; return; }
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { result.textContent = 'Email inválido.'; return; }
          const btn = form.querySelector('button[type="submit"]');
          btn.disabled = true; btn.textContent = 'Enviando...';
          try {
            const res = await fetch('/api/account-requests', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ name, email, message }) });
            const json = await res.json();
            if (!json.ok) throw new Error(json.error || 'Erro ao enviar');
            result.style.color = 'green';
            result.textContent = 'Solicitação enviada. Aguarde aprovação do administrador.';
            form.reset();
          } catch (err) {
            result.style.color = 'red';
            result.textContent = err && err.message ? err.message : 'Erro ao enviar solicitação';
          } finally { btn.disabled = false; btn.textContent = 'Enviar solicitação'; }
        });
      })();
    </script>
  </body>
  </html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

export async function POST() {
  return NextResponse.json({ ok: false, error: 'Use GET to view signup form. Submit via /api/account-requests' }, { status: 405 });
}
