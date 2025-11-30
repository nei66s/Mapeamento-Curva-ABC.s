import { json } from '../_utils';
import { listFlags } from '@/server/adapters/feature-flags-adapter';

export async function GET() {
  const rows = await listFlags();
  return json(rows);
}
