import pool from './db';
import type { WarrantyItem } from './types';

function toIso(d: any) {
  if (!d) return '';
  try {
    return new Date(d).toISOString();
  } catch (err) {
    return String(d);
  }
}

function pickRow(row: any, options: { keys: string[]; asString?: boolean } ) {
  for (const k of options.keys) {
    if (row == null) break;
    if (Object.prototype.hasOwnProperty.call(row, k) && row[k] != null) {
      return options.asString ? String(row[k]) : row[k];
    }
  }
  return options.asString ? '' : null;
}

async function getTableColumns(table: string) {
  try {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name=$1`,
      [table]
    );
    return res.rows.map((r: any) => String(r.column_name));
  } catch (err) {
    return [];
  }
}

export async function listWarranties(): Promise<WarrantyItem[]> {
  try {
    // use SELECT * to avoid failing when column names differ across schemas
    const sql = `SELECT * FROM warranty_items`;
    const res = await pool.query(sql);
    return res.rows.map((row: any) => {
      const itemName = pickRow(row, { keys: ['item_name', 'itemname', 'item', 'name', 'item_name_text'], asString: true });
      const storeLocation = pickRow(row, { keys: ['store_location', 'storelocation', 'store', 'location'], asString: true });
      const serialNumber = pickRow(row, { keys: ['serial_number', 'serialnumber', 'serial', 'serial_no'], asString: true });
      const purchaseDateRaw = pickRow(row, { keys: ['purchase_date', 'purchasedate', 'purchaseDate'], asString: false });
      const warrantyEndRaw = pickRow(row, { keys: ['warranty_end_date', 'warrantyenddate', 'warranty_end', 'warrantyEndDate', 'end_date'], asString: false });
      const supplierId = pickRow(row, { keys: ['supplier_id', 'supplierid', 'supplier'], asString: true });
      const notes = pickRow(row, { keys: ['notes', 'description', 'note'], asString: true });

      return {
        id: row.id != null ? String(row.id) : '',
        itemName: itemName || '',
        storeLocation: storeLocation || '',
        serialNumber: serialNumber || '',
        purchaseDate: toIso(purchaseDateRaw),
        warrantyEndDate: toIso(warrantyEndRaw),
        supplierId: supplierId || '',
        notes: notes || '',
      } as WarrantyItem;
    });
  } catch (err) {
    console.error('listWarranties error', err);
    return [];
  }
}

function mapToRowFields(data: Partial<WarrantyItem>) {
  return {
    item_name: data.itemName || '',
    store_location: data.storeLocation || '',
    serial_number: data.serialNumber || '',
    purchase_date: data.purchaseDate || null,
    warranty_end_date: data.warrantyEndDate || null,
    supplier_id: data.supplierId || null,
    notes: data.notes || '',
  };
}

export async function createWarranty(data: Partial<WarrantyItem>): Promise<WarrantyItem | null> {
  try {
    // detect actual table columns first and build insert using available names
    const cols = await getTableColumns('warranty_items');
    const candidateMap: Record<string, string[]> = {
      itemName: ['item_name', 'itemname', 'item', 'name'],
      storeLocation: ['store_location', 'storelocation', 'store', 'location'],
      serialNumber: ['serial_number', 'serialnumber', 'serial', 'serial_no'],
      purchaseDate: ['purchase_date', 'purchasedate', 'purchaseDate'],
      warrantyEndDate: ['warranty_end_date', 'warrantyenddate', 'warrantyEndDate', 'warranty_end', 'end_date'],
      supplierId: ['supplier_id', 'supplierid', 'supplier'],
      notes: ['notes', 'description', 'note'],
    };

    const mapping: Record<string, any> = {};
    for (const [key, candidates] of Object.entries(candidateMap)) {
      for (const c of candidates) {
        if (cols.includes(c)) {
          // @ts-ignore
          mapping[c] = (data as any)[key] ?? null;
          break;
        }
      }
    }

    const finalCols = Object.keys(mapping);
    if (!finalCols.length) {
      // nothing to insert
      return null;
    }
    const params = finalCols.map((c) => mapping[c]);
    const sql = `INSERT INTO warranty_items (${finalCols.join(',')}) VALUES (${finalCols.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`;
    const res = await pool.query(sql, params);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      itemName: pickRow(row, { keys: ['item_name', 'itemname', 'item', 'name'], asString: true }) || '',
      storeLocation: pickRow(row, { keys: ['store_location', 'storelocation', 'store', 'location'], asString: true }) || '',
      serialNumber: pickRow(row, { keys: ['serial_number', 'serialnumber', 'serial'], asString: true }) || '',
      purchaseDate: toIso(pickRow(row, { keys: ['purchase_date', 'purchasedate', 'purchaseDate'], asString: false })),
      warrantyEndDate: toIso(pickRow(row, { keys: ['warranty_end_date', 'warrantyenddate', 'warrantyEndDate', 'warranty_end', 'end_date'], asString: false })),
      supplierId: pickRow(row, { keys: ['supplier_id', 'supplierid', 'supplier'], asString: true }) || '',
      notes: pickRow(row, { keys: ['notes', 'description', 'note'], asString: true }) || '',
    } as WarrantyItem;
  } catch (err: any) {
    console.error('createWarranty error', err);
    return null;
  }
}

export async function updateWarranty(id: string, data: Partial<WarrantyItem>): Promise<WarrantyItem | null> {
  try {
    const fields = mapToRowFields(data);
    const cols = Object.keys(fields);
    const sets = cols.map((c, i) => `${c}=$${i + 1}`);
    const params = Object.values(fields);
    params.push(id);
    const sql = `UPDATE warranty_items SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`;
    const res = await pool.query(sql, params);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      itemName: pickRow(row, { keys: ['item_name', 'itemname', 'item', 'name'], asString: true }) || '',
      storeLocation: pickRow(row, { keys: ['store_location', 'storelocation', 'store', 'location'], asString: true }) || '',
      serialNumber: pickRow(row, { keys: ['serial_number', 'serialnumber', 'serial'], asString: true }) || '',
      purchaseDate: toIso(pickRow(row, { keys: ['purchase_date', 'purchasedate', 'purchaseDate'], asString: false })),
      warrantyEndDate: toIso(pickRow(row, { keys: ['warranty_end_date', 'warrantyenddate', 'warrantyEndDate', 'end_date'], asString: false })),
      supplierId: pickRow(row, { keys: ['supplier_id', 'supplierid', 'supplier'], asString: true }) || '',
      notes: pickRow(row, { keys: ['notes', 'description', 'note'], asString: true }) || '',
    } as WarrantyItem;
  } catch (err: any) {
    console.error('updateWarranty error', err);
    // fallback: try detect columns and build update dynamically
    try {
      const cols = await getTableColumns('warranty_items');
      if (!cols.length) return null;
      const candidateMap: Record<string, string[]> = {
        itemName: ['item_name', 'itemname', 'item', 'name'],
        storeLocation: ['store_location', 'storelocation', 'store', 'location'],
        serialNumber: ['serial_number', 'serialnumber', 'serial'],
        purchaseDate: ['purchase_date', 'purchasedate', 'purchaseDate'],
        warrantyEndDate: ['warranty_end_date', 'warrantyenddate', 'warrantyEndDate', 'end_date'],
        supplierId: ['supplier_id', 'supplierid', 'supplier'],
        notes: ['notes', 'description', 'note'],
      };
      const mapping: Record<string, any> = {};
      for (const [key, candidates] of Object.entries(candidateMap)) {
        for (const c of candidates) {
          if (cols.includes(c) && (data as any)[key] !== undefined) {
            mapping[c] = (data as any)[key];
            break;
          }
        }
      }
      const finalCols = Object.keys(mapping);
      if (!finalCols.length) return null;
      const sets = finalCols.map((c, i) => `${c}=$${i + 1}`);
      const params = finalCols.map((c) => mapping[c]);
      params.push(id);
      const sql = `UPDATE warranty_items SET ${sets.join(',')} WHERE id=$${params.length} RETURNING *`;
      const res = await pool.query(sql, params);
      const row = res.rows[0];
      if (!row) return null;
      return {
        id: String(row.id),
        itemName: pickRow(row, { keys: ['item_name', 'itemname', 'item', 'name'], asString: true }) || '',
        storeLocation: pickRow(row, { keys: ['store_location', 'storelocation', 'store', 'location'], asString: true }) || '',
        serialNumber: pickRow(row, { keys: ['serial_number', 'serialnumber', 'serial'], asString: true }) || '',
        purchaseDate: toIso(pickRow(row, { keys: ['purchase_date', 'purchasedate', 'purchaseDate'], asString: false })),
        warrantyEndDate: toIso(pickRow(row, { keys: ['warranty_end_date', 'warrantyenddate', 'warrantyEndDate', 'end_date'], asString: false })),
        supplierId: pickRow(row, { keys: ['supplier_id', 'supplierid', 'supplier'], asString: true }) || '',
        notes: pickRow(row, { keys: ['notes', 'description', 'note'], asString: true }) || '',
      } as WarrantyItem;
    } catch (err2) {
      console.error('updateWarranty fallback error', err2);
      return null;
    }
  }
}

export async function deleteWarranty(id: string): Promise<boolean> {
  try {
    await pool.query(`DELETE FROM warranty_items WHERE id=$1`, [id]);
    return true;
  } catch (err) {
    console.error('deleteWarranty error', err);
    return false;
  }
}
