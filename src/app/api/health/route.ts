export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import pool from '@/lib/db';
import Redis from 'ioredis';
import { logAudit } from '@/server/adapters/audit-adapter';
import { readRecentErrors } from '@/server/error-logger';

export async function GET() {
  try {
    const uptimeSeconds = Math.floor(process.uptime());

    // read package.json to obtain current version
    let version = 'unknown';
    try {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkgRaw = await fs.readFile(pkgPath, 'utf8');
      const pkg = JSON.parse(pkgRaw);
      version = pkg.version || version;
    } catch (e) {
      // keep version 'unknown' if reading fails
    }

    const dependencies: any[] = [];

    // Check Postgres
    try {
      const start = Date.now();
      await pool.query('SELECT 1');
      const latency = Date.now() - start;
      dependencies.push({ name: 'postgres', status: 'healthy', lastChecked: new Date().toISOString(), latencyMs: latency });
    } catch (e: any) {
      dependencies.push({ name: 'postgres', status: 'down', lastChecked: new Date().toISOString(), details: String(e && e.message ? e.message : e) });
    }

    // Check Redis if configured
    const REDIS_URL = process.env.REDIS_URL || null;
    if (REDIS_URL) {
      let client: Redis | null = null;
      try {
        const start = Date.now();
        client = new Redis(REDIS_URL, { maxRetriesPerRequest: 1, connectTimeout: 2000 });
        await client.ping();
        const latency = Date.now() - start;
        dependencies.push({ name: 'redis', status: 'healthy', lastChecked: new Date().toISOString(), latencyMs: latency });
      } catch (e: any) {
        dependencies.push({ name: 'redis', status: 'down', lastChecked: new Date().toISOString(), details: String(e && e.message ? e.message : e) });
      } finally {
        try { if (client) client.disconnect(); } catch (e) {}
      }
    }

    // Fetch recent error-like audit logs to populate lastErrors
    let lastErrors: any[] = [];
    try {
      const errRes = await pool.query(
        `SELECT id, action, before_data, after_data, ip, user_agent, created_at FROM audit_logs
         WHERE action ILIKE '%error%' OR action ILIKE '%exception%' OR entity = 'error'
         ORDER BY created_at DESC LIMIT 10`
      );
      lastErrors = errRes.rows.map((r: any) => {
        const data = r.after_data || r.before_data || {};
        const message = data && (data.message || data.msg || data.error || JSON.stringify(data)) || r.action || 'error';
        return {
          id: r.id,
          message: typeof message === 'string' ? message : JSON.stringify(message),
          stack: data && data.stack ? data.stack : undefined,
          timestamp: r.created_at ? (r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at)) : new Date().toISOString(),
          service: data && data.service ? data.service : undefined,
          statusCode: data && (data.statusCode || data.status) ? (data.statusCode || data.status) : undefined,
        };
      });
    } catch (e) {
      // ignore errors reading audit logs
      console.error('Failed to fetch lastErrors for healthcheck', e);
      lastErrors = [];
    }

    // also read recent file-based errors and merge with audit log errors
    let fileErrors: any[] = [];
    try {
      fileErrors = await readRecentErrors(10);
    } catch (e) {
      fileErrors = [];
    }

    // combine and dedupe by id/message+timestamp, prefer audit log entries
    const combinedMap = new Map<string, any>();
    (lastErrors || []).forEach((e: any) => {
      const key = e.id || `${e.message}-${e.timestamp}`;
      combinedMap.set(key, e);
    });
    (fileErrors || []).forEach((e: any) => {
      const key = e.id || `${e.message}-${e.timestamp}`;
      if (!combinedMap.has(key)) combinedMap.set(key, e);
    });

    const combined = Array.from(combinedMap.values()).sort((a: any, b: any) => (b.timestamp || '').localeCompare(a.timestamp || '')).slice(0, 10);

    const snapshot = {
      status: 'healthy',
      uptimeSeconds,
      version,
      dependencies,
      lastErrors: combined,
    };

    // write an audit log so health checks appear in logs
    try {
      await logAudit({ user_id: 'system', entity: 'health', entity_id: 'health', action: 'health.check', before_data: null, after_data: snapshot });
    } catch (e) {
      // don't fail healthcheck for audit logging errors
      console.error('Failed to write health audit log', e);
    }

    return NextResponse.json(snapshot);
  } catch (err) {
    console.error('Health check error', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
