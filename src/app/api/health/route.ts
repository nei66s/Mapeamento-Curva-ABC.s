import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const uptimeSeconds = Math.floor(process.uptime());
    return NextResponse.json({
      status: 'ok',
      time: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
    });
  } catch (err) {
    console.error('Health check error', err);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}
