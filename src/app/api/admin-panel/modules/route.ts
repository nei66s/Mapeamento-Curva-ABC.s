export const runtime = 'nodejs';

import { json } from '../_utils';
import { listModules } from '@/server/adapters/modules-adapter';

export async function GET() {
  const rows = await listModules();
  return json(rows);
}
