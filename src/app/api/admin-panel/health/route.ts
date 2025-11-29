import { healthSnapshot } from '../_data';
import { isModuleActive, json } from '../_utils';

export async function GET() {
  if (!isModuleActive('admin-health')) return json({ message: 'Módulo de health inativo.' }, 403);
  return json(healthSnapshot);
}
