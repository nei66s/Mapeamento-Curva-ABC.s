export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';

async function getUserFromRequest(req: NextRequest) {
  try {
    const pm = req.cookies.get('pm_user')?.value;
    if (!pm) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(pm));
      return parsed;
    } catch (e) {
      return null;
    }
  } catch (e) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });

    const body = await request.json();
    if (!body || !body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ ok: false, error: 'Payload inválido' }, { status: 400 });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    // If supabase config is missing, try to fall back to a local DB pool (server-side)
    if (!supabaseUrl || !supabaseKey) {
      try {
        const attempts: Array<() => Promise<any>> = [() => import('@/lib/db'), () => import('../../../lib/db')];
        for (const attempt of attempts) {
          try {
            const mod = await attempt();
            const pool = (mod && (mod.default || mod));
            if (pool && typeof pool.query === 'function') {
              // If id provided, query single, otherwise list
              const id = request.nextUrl.searchParams.get('id');
              if (id) {
                const res = await pool.query('SELECT * FROM escopos WHERE id = $1 LIMIT 1', [id]);
                return NextResponse.json({ ok: true, result: res.rows && res.rows.length ? res.rows[0] : null });
              }
              const res = await pool.query('SELECT * FROM escopos ORDER BY created_at DESC LIMIT 200');
              return NextResponse.json({ ok: true, result: res.rows || [] });
            }
          } catch (e) {
            // try next candidate
          }
        }
        return NextResponse.json({ ok: false, error: 'Configuração do Supabase ausente' }, { status: 500 });
      } catch (err) {
        return NextResponse.json({ ok: false, error: 'Configuração do Supabase ausente' }, { status: 500 });
      }
    }

    const payload = {
      title: body.title || null,
      description: body.description || null,
      norms: body.norms || null,
      requester: body.requester || null,
      store_id: body.store_id || null,
      items: body.items || [],
      attachments: body.attachments || [],
      created_by: user.id || null,
      created_at: new Date().toISOString(),
    };

    const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/escopos?select=*&prefer=return=representation`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const err = (data && data.message) ? data.message : 'Erro ao inserir escopo';
      return NextResponse.json({ ok: false, error: err }, { status: res.status || 500 });
    }

    return NextResponse.json({ ok: true, result: Array.isArray(data) ? data[0] : data });
  } catch (error: any) {
    console.error('Error in /api/escopos POST:', error);
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

    // If Supabase config is missing, try to fall back to a local DB pool (server-side)
    if (!supabaseUrl || !supabaseKey) {
      try {
        const attempts: Array<() => Promise<any>> = [() => import('@/lib/db'), () => import('../../../lib/db')];
        for (const attempt of attempts) {
          try {
            const mod = await attempt();
            const pool = (mod && (mod.default || mod));
            if (pool && typeof pool.query === 'function') {
              const id = request.nextUrl.searchParams.get('id');
              if (id) {
                const res = await pool.query('SELECT * FROM escopos WHERE id = $1 LIMIT 1', [id]);
                return NextResponse.json({ ok: true, result: res.rows && res.rows.length ? res.rows[0] : null });
              }
              const res = await pool.query('SELECT * FROM escopos ORDER BY created_at DESC LIMIT 200');
              return NextResponse.json({ ok: true, result: res.rows || [] });
            }
          } catch (e) {
            // try next candidate
          }
        }
        return NextResponse.json({ ok: false, error: 'Configuração do Supabase ausente' }, { status: 500 });
      } catch (err) {
        return NextResponse.json({ ok: false, error: 'Configuração do Supabase ausente' }, { status: 500 });
      }
    }
    const id = request.nextUrl.searchParams.get('id');
    // If an id is provided, return the single escopo. Otherwise return a list of recent escopos.
    if (id) {
      const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/escopos?id=eq.${encodeURIComponent(id)}&select=*`;
      const res = await fetch(url, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: data?.message || 'Erro ao buscar escopo' }, { status: res.status || 500 });
      }
      return NextResponse.json({ ok: true, result: Array.isArray(data) && data.length ? data[0] : data });
    }

    // No id -> list escopos (recent)
    const listUrl = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/escopos?select=*&order=created_at.desc&limit=200`;
    const listRes = await fetch(listUrl, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    });
    const listData = await listRes.json().catch(() => null);
    if (!listRes.ok) {
      return NextResponse.json({ ok: false, error: listData?.message || 'Erro ao listar escopos' }, { status: listRes.status || 500 });
    }
    return NextResponse.json({ ok: true, result: Array.isArray(listData) ? listData : [] });
  } catch (e: any) {
    console.error('Error in /api/escopos GET:', e);
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
