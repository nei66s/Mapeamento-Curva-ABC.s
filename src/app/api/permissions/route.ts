import { NextResponse } from 'next/server';
import { getPermissionsMapping, setPermission } from '@/lib/permissions.server';

export async function GET() {
  try {
    const permissions = await getPermissionsMapping();
    return NextResponse.json({ permissions });
  } catch (err) {
    console.error('GET /api/permissions error', err);
    return NextResponse.json({ error: 'Failed to load permissions' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { role, moduleId, allowed } = body || {};
    if (!role || !moduleId || typeof allowed !== 'boolean') {
      return NextResponse.json({ error: 'role, moduleId and allowed are required' }, { status: 400 });
    }
    await setPermission(String(role), String(moduleId), Boolean(allowed));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('PUT /api/permissions error', err);
    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 });
  }
}

