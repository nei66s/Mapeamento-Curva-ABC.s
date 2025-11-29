import { json } from '../_utils';
import { featureFlags } from '../_data';

export async function GET() {
  return json(featureFlags);
}
