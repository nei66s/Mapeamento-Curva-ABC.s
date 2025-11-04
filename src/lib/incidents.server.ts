import { Incident } from './types';
import pool from './db';

// Buscar todos os incidentes da tabela `incidents`
export async function getIncidents(): Promise<Incident[]> {
  const res = await pool.query(
    `SELECT id, item_name AS "itemName", location, status, opened_at AS "openedAt", description, lat, lng FROM incidents ORDER BY opened_at DESC`
  );
  return res.rows;
}

// Função opcional para inserir um incidente (padrão). Pode ser usada depois.
export async function createIncident(incident: Omit<Incident, 'id'|'openedAt'|'status'>) {
  const res = await pool.query(
    `INSERT INTO incidents (item_name, location, description, lat, lng, status, opened_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, item_name AS "itemName", location, status, opened_at AS "openedAt", description, lat, lng`,
    [incident.itemName, incident.location, incident.description, incident.lat || 0, incident.lng || 0, 'Aberto', new Date().toISOString()]
  );
  return res.rows[0] as Incident;
}
