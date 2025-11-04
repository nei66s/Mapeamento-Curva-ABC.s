import pool from './db';
import type { Supplier } from './types';

function pick(...keys: string[]) {
  return (row: any) => {
    for (const k of keys) {
      if (row == null) break;
      if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null) return row[k];
    }
    return '';
  };
}

export type ListSuppliersOptions = {
  limit?: number;
  offset?: number;
  // if true, try to keep backward compatibility for picking fields from unknown column names
  normalizeContact?: boolean;
};

export async function listSuppliers(opts: ListSuppliersOptions = {}): Promise<Supplier[]> {
  try {
    // select only needed columns to reduce transfer size and parsing time
    const cols = ['id', 'name', 'contact', 'contact_email', 'cnpj', 'specialty'];
    const parts: string[] = [`SELECT ${cols.join(', ')} FROM suppliers`];
    parts.push('ORDER BY name ASC');
    const params: any[] = [];
    if (typeof opts.limit === 'number') {
      params.push(opts.limit);
      parts.push(`LIMIT $${params.length}`);
    }
    if (typeof opts.offset === 'number') {
      params.push(opts.offset);
      parts.push(`OFFSET $${params.length}`);
    }

    const sql = parts.join(' ');
    const res = await pool.query(sql, params);

    const pickContactName = pick('contact_name', 'contactName', 'contactname', 'contact_name_text', 'contact');
    const pickContactEmail = pick('contact_email', 'contactEmail', 'contactemail', 'contact_email_text');

    return res.rows.map((row: any) => {
      const rawContact = opts.normalizeContact ? (pickContactName(row) || '') : (row.contact || '');
      // try to extract an email from the contact string (if contact column contains both name and email)
      const emailMatch = String(rawContact).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
      const contactEmail = emailMatch ? emailMatch[0] : (opts.normalizeContact ? (pickContactEmail(row) || '') : (row.contact_email || ''));
      const contactName = rawContact && emailMatch ? String(rawContact).replace(emailMatch[0], '').trim().replace(/[<>]/g, '') : (rawContact || (row.contact_name || ''));

      return {
        id: String(row.id),
        name: row.name || row.nome || '',
        contactName: contactName,
        contactEmail: contactEmail,
        cnpj: row.cnpj || row.cpf || '',
        specialty: row.specialty || row.especialidade || '',
      } as Supplier;
    });
  } catch (err) {
    // If the table doesn't exist or another DB error occurs, log and return empty list
    console.error('listSuppliers error', err);
    return [];
  }
}

export async function createSupplier(data: Omit<Supplier, 'id'>): Promise<Supplier | null> {
  try {
    const res = await pool.query(
      `INSERT INTO suppliers (name, contact, contact_email, cnpj, specialty)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.name, data.contactName || data.contactEmail || '', data.contactEmail || '', data.cnpj || '', data.specialty || '']
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      name: row.name || '',
      contactName: row.contact_name || row.contact || row.contactName || '',
      contactEmail: row.contact_email || '',
      cnpj: row.cnpj || '',
      specialty: row.specialty || '',
    } as Supplier;
  } catch (err) {
    console.error('createSupplier error', err);
    return null;
  }
}

export async function createSuppliersBulk(items: Omit<Supplier, 'id'>[]): Promise<Supplier[]> {
  if (!items.length) return [];
  // Bulk insert using a single query to reduce round-trips
  // Build parameterized values list
  const cols = ['name', 'contact', 'contact_email', 'cnpj', 'specialty'];
  const values: string[] = [];
  const params: any[] = [];
  items.forEach((it, i) => {
    const base = i * cols.length;
    const placeholders = cols.map((_, j) => `$${base + j + 1}`);
    values.push(`(${placeholders.join(', ')})`);
    params.push(it.name || '', it.contactName || it.contactEmail || '', it.contactEmail || '', it.cnpj || '', it.specialty || '');
  });

  const sql = `INSERT INTO suppliers (${cols.join(', ')}) VALUES ${values.join(', ')} RETURNING *`;
  try {
    const res = await pool.query(sql, params);
    return res.rows.map((row: any) => ({
      id: String(row.id),
      name: row.name || '',
      contactName: row.contact_name || row.contact || '',
      contactEmail: row.contact_email || '',
      cnpj: row.cnpj || '',
      specialty: row.specialty || '',
    } as Supplier));
  } catch (err) {
    console.error('createSuppliersBulk error', err);
    // fallback to sequential creates to maximize chance of partial success
    const created: Supplier[] = [];
    for (const it of items) {
      const c = await createSupplier(it);
      if (c) created.push(c);
    }
    return created;
  }
}

export async function updateSupplier(id: string, data: Omit<Supplier, 'id'>): Promise<Supplier | null> {
  try {
    const res = await pool.query(
      `UPDATE suppliers SET name=$1, contact=$2, contact_email=$3, cnpj=$4, specialty=$5 WHERE id=$6 RETURNING *`,
      [data.name, data.contactName || data.contactEmail || '', data.contactEmail || '', data.cnpj || '', data.specialty || '', id]
    );
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      name: row.name || '',
      contactName: row.contact_name || row.contact || '',
      contactEmail: row.contact_email || '',
      cnpj: row.cnpj || '',
      specialty: row.specialty || '',
    } as Supplier;
  } catch (err) {
    console.error('updateSupplier error', err);
    return null;
  }
}

export async function deleteSupplier(id: string): Promise<boolean> {
  try {
    await pool.query(`DELETE FROM suppliers WHERE id=$1`, [id]);
    return true;
  } catch (err) {
    console.error('deleteSupplier error', err);
    return false;
  }
}

