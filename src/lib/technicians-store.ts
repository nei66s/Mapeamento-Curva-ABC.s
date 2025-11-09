// Simple in-memory technicians store used by the API during development.
// This is intentionally module-scoped state so the API can mutate it across requests
// while running the dev server. For production you'd persist this to a DB.
import type { Technician } from './types';

const initial: Technician[] = [
  { id: 'tech-1', name: 'Fulano de Tal', role: 'Técnico de Refrigeração' },
  { id: 'tech-2', name: 'Ciclano de Souza', role: 'Técnico Eletricista' },
];

let store: Technician[] = [...initial];

export function getTechnicians(): Technician[] {
  return store;
}

export function addTechnician(t: Technician): Technician {
  store = [t, ...store];
  return t;
}

export function deleteTechnician(id: string): boolean {
  const before = store.length;
  store = store.filter(t => t.id !== id);
  return store.length !== before;
}

export function resetTechnicians() {
  store = [...initial];
}
