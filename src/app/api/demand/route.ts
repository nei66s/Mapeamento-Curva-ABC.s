import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type RawIndicatorRow = {
  data: {
    mes?: string;
    chamados_abertos?: number;
    backlog?: number;
  };
};

type DemandResponse = {
  currentOpen: number;
  averageOpen: number;
  backlog: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  trend: 'rising' | 'steady' | 'falling';
};

function computeSeverity(current: number, average: number): DemandResponse['severity'] {
  if (average === 0) return 'info';
  if (current > average * 1.4) return 'critical';
  if (current > average * 1.15) return 'warning';
  return 'info';
}

export async function GET() {
  try {
    await pool.query('SELECT 1'); // ensure connection
    const res = await pool.query('SELECT data FROM indicators ORDER BY mes DESC LIMIT 6');
    const rows = (res.rows as RawIndicatorRow[]).map(r => r.data ?? {});
    const current = rows[0] ?? {};
    const rest = rows.slice(1);
    const average =
      rest.length > 0
        ? rest.reduce((acc, row) => acc + Number(row.chamados_abertos ?? 0), 0) / rest.length
        : Number(current.chamados_abertos ?? 0);
    const currentOpen = Number(current.chamados_abertos ?? 0);
    const backlog = Number(current.backlog ?? 0);
    const severity = computeSeverity(currentOpen, average);
    const trend =
      rest.length === 0
        ? 'steady'
        : currentOpen > average
          ? 'rising'
          : currentOpen < average * 0.85
            ? 'falling'
            : 'steady';

    const message =
      severity === 'critical'
        ? 'Demanda acima de 40% da média — priorize recursos e manutenção preventiva imediata.'
        : severity === 'warning'
          ? 'Demanda em alta — monitore ativos críticos e reforçe suporte.'
          : 'Demanda estabilizada; continue monitorando os indicadores.';

    const payload: DemandResponse = {
      currentOpen,
      averageOpen: Math.round(average),
      backlog,
      severity,
      message,
      trend,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error('GET /api/demand error', err);
    return NextResponse.json(
      {
        currentOpen: 0,
        averageOpen: 0,
        backlog: 0,
        severity: 'info',
        message: 'Não há dados suficientes para analisar a demanda.',
        trend: 'steady',
      },
      { status: 500 }
    );
  }
}
