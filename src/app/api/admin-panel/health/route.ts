export const runtime = 'nodejs';

import { json } from '../_utils';
import { getModuleByKey } from '@/server/adapters/modules-adapter';
import pool from '@/lib/db';
import { getAi } from '@/ai/genkit';
import { execFileSync } from 'child_process';

export async function GET() {
  const mod = await getModuleByKey('admin-health');
  if (mod && !mod.is_active) return json({ message: 'Módulo de health inativo.' }, 403);
    try {
      const uptimeSeconds = Math.floor(process.uptime());
      let ok = false;
      let lastErrors: any[] = [];

      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

      if (supabaseUrl && supabaseKey) {
        try {
          // Try to read a lightweight record from metrics_cache via Supabase REST API
          const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/metrics_cache?select=metric_key,metric_value&limit=1`;
          const res = await fetch(url, {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
              Accept: 'application/json',
            },
          });
          if (res.ok) {
            ok = true;
            try {
              const arr = await res.json();
              if (Array.isArray(arr) && arr.length) {
                const v = arr[0].metric_value;
                if (Array.isArray(v)) lastErrors = v;
                else if (v && typeof v === 'object' && v.lastErrors) lastErrors = v.lastErrors;
              }
            } catch (e) {
              // ignore parse errors
            }
          } else {
            ok = false;
          }
        } catch (e) {
          ok = false;
        }
      } else {
        // Fallback: direct DB check
        try {
          const r = await pool.query('SELECT 1 as ok');
          ok = r.rows?.[0]?.ok === 1;
        } catch (e) {
          ok = false;
        }

        // try to read recent errors metric from metrics_cache
        try {
          const er = await pool.query("select metric_key, metric_value from metrics_cache where metric_key ilike '%error%' limit 1");
          if (er.rowCount) {
            const v = er.rows[0].metric_value;
            if (Array.isArray(v)) lastErrors = v;
            else if (v && typeof v === 'object' && v.lastErrors) lastErrors = v.lastErrors;
          }
        } catch (e) {
          // ignore
        }
      }

      // check AI availability
      let aiOk = false;
      let aiLatency = 0;
      try {
        const t0 = Date.now();
        await getAi();
        aiLatency = Date.now() - t0;
        aiOk = true;
      } catch (e) {
        aiOk = false;
      }

      const maskDb = (raw?: string) => {
        if (!raw) return null;
        try {
          const u = new URL(raw);
          return `${u.hostname}${u.port ? ':' + u.port : ''}/${(u.pathname || '').replace(/^\//, '')}`;
        } catch (e) {
          // fallback: hide credentials
          return raw.replace(/:[^:@]+@/, ':****@');
        }
      };

      const connections: Array<{ key: string; value: string | null }> = [];
      connections.push({ key: 'DATABASE_URL', value: maskDb(process.env.DATABASE_URL) });
      connections.push({ key: 'SUPABASE_DB_URL', value: maskDb(process.env.SUPABASE_DB_URL) });
      connections.push({ key: 'SUPABASE_URL', value: process.env.SUPABASE_URL || null });

      const getVersionInfo = (): { version: string; commitUnix?: number } => {
        // Prefer a tag that points at HEAD, then nearest tag, then environment overrides, then SHA fallback.
        try {
          const tagOut = String(execFileSync('git', ['tag', '--points-at', 'HEAD'], { encoding: 'utf8' })).trim();
          if (tagOut) {
            const tag = tagOut.split(/\r?\n/)[0];
            const ts = String(execFileSync('git', ['show', '-s', '--format=%ct', tag], { encoding: 'utf8' })).trim();
            return { version: tag, commitUnix: Number(ts) };
          }
        } catch (e) {
          // ignore
        }

        try {
          const nearest = String(execFileSync('git', ['describe', '--tags', '--abbrev=0'], { encoding: 'utf8' })).trim();
          if (nearest) {
            const ts = String(execFileSync('git', ['show', '-s', '--format=%ct', nearest], { encoding: 'utf8' })).trim();
            return { version: nearest, commitUnix: Number(ts) };
          }
        } catch (e) {
          // ignore
        }

        const envCandidates = [
          'APP_VERSION',
          'APP_COMMIT',
          'GIT_COMMIT',
          'NEXT_PUBLIC_COMMIT_SHA',
          'VERCEL_GIT_COMMIT_SHA',
          'GITHUB_SHA',
          'npm_package_version',
        ];
        for (const k of envCandidates) {
          if (process.env[k]) return { version: String(process.env[k]) };
        }

        try {
          const sha = String(execFileSync('git', ['rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' })).trim();
          const ts = String(execFileSync('git', ['show', '-s', '--format=%ct', 'HEAD'], { encoding: 'utf8' })).trim();
          return { version: sha, commitUnix: Number(ts) };
        } catch (e) {
          // ignore
        }

        return { version: process.env.npm_package_version || process.env.APP_VERSION || 'unknown' };
      };

      const vinfo = getVersionInfo();
      const version = vinfo.version;

      // Compute uptime since first commit in repository when available
      let uptimeSecondsFinal = uptimeSeconds;
      try {
        const firstSha = String(execFileSync('git', ['rev-list', '--max-parents=0', 'HEAD'], { encoding: 'utf8' })).trim();
        if (firstSha) {
          const firstTs = String(execFileSync('git', ['show', '-s', '--format=%ct', firstSha], { encoding: 'utf8' })).trim();
          const firstUnix = Number(firstTs);
          if (firstUnix && !Number.isNaN(firstUnix)) {
            uptimeSecondsFinal = Math.max(0, Math.floor(Date.now() / 1000) - firstUnix);
          }
        }
      } catch (e) {
        // fallback to process uptimeSeconds
        uptimeSecondsFinal = uptimeSeconds;
      }

      const snapshot = {
        status: ok && aiOk ? 'healthy' : (ok || aiOk) ? 'degraded' : 'down',
        uptimeSeconds: uptimeSecondsFinal,
        version,
        dependencies: [
          { name: 'supabase', status: ok ? 'healthy' : 'down', lastChecked: new Date().toISOString(), latencyMs: 0 },
          { name: 'ia', status: aiOk ? 'healthy' : 'down', lastChecked: new Date().toISOString(), latencyMs: aiLatency },
        ],
        lastErrors,
        connections,
      };
      return json(snapshot);
  } catch (e) {
    return json({ message: 'Erro ao montar snapshot de health' }, 500);
  }
}
