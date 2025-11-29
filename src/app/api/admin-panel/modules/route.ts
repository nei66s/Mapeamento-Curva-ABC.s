import { json } from '../_utils';
import { featureModules } from '../_data';

export async function GET() {
  return json(featureModules);
}
