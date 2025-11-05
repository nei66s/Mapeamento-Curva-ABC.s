import pool from './db';
import type { ComplianceChecklistItem, StoreComplianceData, ComplianceStatus } from './types';

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

export async function listChecklistItems(): Promise<ComplianceChecklistItem[]> {
  try {
    const sql = `SELECT * FROM compliance_checklist_items`;
    const res = await pool.query(sql);
    return res.rows.map((row: any) => ({
      id: row.id != null ? String(row.id) : (row.item_id != null ? String(row.item_id) : ''),
      name: pickRow(row, { keys: ['name', 'item_name', 'label'], asString: true }) || '',
      classification: (pickRow(row, { keys: ['classification', 'class'], asString: true }) || 'C') as any,
    } as ComplianceChecklistItem));
  } catch (err) {
    // If the table doesn't exist, don't spam the console during dev — return empty list.
    // Postgres error code 42P01 = undefined_table
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('listChecklistItems: table missing compliance_checklist_items');
      } else {
        console.error('listChecklistItems error', err);
      }
    } catch (__) {
      console.error('listChecklistItems error', err);
    }
    return [];
  }
}

export async function listScheduledVisits(): Promise<StoreComplianceData[]> {
  try {
    // Expect a table with visits and visit_items or a denormalized table. Try to be tolerant.
    // First try to get denormalized rows
    const sql = `SELECT * FROM compliance_visits`;
    const res = await pool.query(sql);
    // If rows are empty, return []
    if (!res.rows || !res.rows.length) return [];

    // Map rows: attempt to detect fields
    if (res.rows && res.rows.length) {
      return res.rows.map((row: any) => {
      const visitDateRaw = pickRow(row, { keys: ['visit_date', 'visitdate', 'date'], asString: false });
      const itemsRaw = pickRow(row, { keys: ['items', 'visit_items', 'checklist_items'], asString: false }) || [];

      // itemsRaw might be json/text or null
      let items: { itemId: string; status: ComplianceStatus }[] = [];
      try {
        if (typeof itemsRaw === 'string') {
          items = JSON.parse(itemsRaw);
        } else if (Array.isArray(itemsRaw)) {
          items = itemsRaw;
        }
      } catch (err) {
        items = [];
      }

      return {
        storeId: pickRow(row, { keys: ['store_id', 'storeid', 'store'], asString: true }) || '',
        storeName: pickRow(row, { keys: ['store_name', 'storename', 'store_name_text', 'store'], asString: true }) || '',
        visitDate: toIso(visitDateRaw),
        items: items.map((it: any) => ({ itemId: String(it.itemId || it.id || it.item_id || ''), status: (it.status || 'pending') })) as any,
      } as StoreComplianceData;
      });
    }

    // If no denormalized table rows, try an alternative normalized table that stores per-visit status
    const altCols = await getTableColumns('store_compliance_data');
    if (altCols && altCols.length) {
      try {
        const r2 = await pool.query(`SELECT * FROM store_compliance_data`);
        return r2.rows.map((row: any) => ({
          storeId: pickRow(row, { keys: ['store_id','storeid','store'], asString: true }) || '',
          storeName: pickRow(row, { keys: ['store_name','storename'], asString: true }) || String(pickRow(row, { keys: ['store_id','storeid','store'], asString: true }) || ''),
          visitDate: toIso(pickRow(row, { keys: ['visit_date','visitdate','date'], asString: false })),
          // map visit-level status into a single synthetic item so UI can show pending/completed
          items: [{ itemId: String(row.id != null ? row.id : row.store_id), status: String(row.status || 'pending') }],
        } as StoreComplianceData));
      } catch (err) {
        // ignore and fall through
      }
    }

    return [];
  } catch (err) {
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('listScheduledVisits: table missing compliance_visits');
      } else {
        console.error('listScheduledVisits error', err);
      }
    } catch (__) {
      console.error('listScheduledVisits error', err);
    }
    return [];
  }
}

export async function scheduleVisit(data: Partial<StoreComplianceData>): Promise<StoreComplianceData | null> {
  try {
    // Try to insert into compliance_visits if table exists and supports columns
    const cols = await getTableColumns('compliance_visits');
    const mapping: Record<string, any> = {};
    const candidates: Record<string, string[]> = {
      storeId: ['store_id', 'storeid', 'store'],
      storeName: ['store_name', 'storename', 'store_name_text', 'store'],
      visitDate: ['visit_date', 'visitdate', 'date'],
      items: ['items', 'visit_items', 'checklist_items'],
    };

    for (const [key, cand] of Object.entries(candidates)) {
      for (const c of cand) {
        if (cols.includes(c)) {
          mapping[c] = (data as any)[key] ?? null;
          break;
        }
      }
    }

    const finalCols = Object.keys(mapping);
    if (!finalCols.length) return null;
    // Ensure JSON/JSONB columns are passed as JSON strings (Postgres expects proper JSON text)
    const params = finalCols.map((c) => {
      const val = mapping[c];
      if (val == null) return null;
      // If this column looks like it stores JSON/JSONB (items), ensure it's a JSON string
      if (c === 'items' || c === 'visit_items' || c === 'checklist_items') {
        try {
          // If already a string that looks like JSON, leave it; otherwise stringify
          if (typeof val === 'string') {
            // quick sanity check
            const trimmed = val.trim();
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
              return val;
            }
          }
          return JSON.stringify(val);
        } catch (err) {
          return JSON.stringify(val);
        }
      }
      return val;
    });
    const sql = `INSERT INTO compliance_visits (${finalCols.join(',')}) VALUES (${finalCols.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`;
    const res = await pool.query(sql, params);
    const row = res.rows[0];
    if (!row) return null;
    // Map back to StoreComplianceData
    const visitDateRaw = pickRow(row, { keys: ['visit_date', 'visitdate', 'date'], asString: false });
    const itemsRaw = pickRow(row, { keys: ['items', 'visit_items', 'checklist_items'], asString: false }) || [];
    let items: { itemId: string; status: ComplianceStatus }[] = [];
    try { items = typeof itemsRaw === 'string' ? JSON.parse(itemsRaw) : itemsRaw; } catch (err) { items = []; }

    return {
      storeId: pickRow(row, { keys: ['store_id', 'storeid', 'store'], asString: true }) || '',
      storeName: pickRow(row, { keys: ['store_name', 'storename', 'store_name_text', 'store'], asString: true }) || '',
      visitDate: toIso(visitDateRaw),
      items: items.map((it: any) => ({ itemId: String(it.itemId || it.id || it.item_id || ''), status: (it.status || 'pending') })) as any,
    } as StoreComplianceData;
  } catch (err) {
    // If compliance_visits doesn't exist or insert failed due to schema differences,
    // try to insert into a normalized table `store_compliance_data` when available.
    try {
      const altCols = await getTableColumns('store_compliance_data');
      if (altCols && altCols.length) {
        // determine column names
        const storeCol = altCols.find(c => ['store_id','storeid','store'].includes(c));
        const visitCol = altCols.find(c => ['visit_date','visitdate','date'].includes(c));
        const statusCol = altCols.find(c => ['status','visit_status','item_status'].includes(c));
        if (storeCol && visitCol) {
          const s = data.storeId ?? (data.storeName ?? '');
          const v = data.visitDate ?? null;
          const st = 'pending';
          const sql2 = `INSERT INTO store_compliance_data (${storeCol}, ${visitCol}, ${statusCol || 'status'}) VALUES ($1, $2, $3) RETURNING *`;
          const res2 = await pool.query(sql2, [s, v, st]);
          const r = res2.rows[0];
          return {
            storeId: String(r[storeCol] || s),
            storeName: String(r['store_name'] || r[storeCol] || s),
            visitDate: toIso(r[visitCol]),
            items: [{ itemId: String(r.id || r[storeCol]), status: String(r[statusCol || 'status'] || st) }],
          } as StoreComplianceData;
        }
      }
    } catch (err2) {
      console.error('scheduleVisit fallback error', err2);
    }
    console.error('scheduleVisit error', err);
    return null;
  }
}

export async function updateVisitItemStatus(storeId: string, visitDate: string, itemId: string, status: ComplianceStatus): Promise<boolean> {
  try {
    // Best-effort: try to update a JSONB/JSON column if exists, otherwise skip
    const cols = await getTableColumns('compliance_visits');
    if (cols.includes('items')) {
      // read row
      const res = await pool.query(`SELECT * FROM compliance_visits WHERE store_id=$1 AND (visit_date::text LIKE $2 OR visit_date=$3) LIMIT 1`, [storeId, `${visitDate}%`, visitDate]);
      const row = res.rows[0];
      if (!row) return false;
      let items: any[] = [];
      try { items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []); } catch (err) { items = row.items || []; }
      const changed = items.map(it => ({ ...it, status: (it.itemId === itemId || it.item_id === itemId || it.id === itemId) ? status : it.status }));
      await pool.query(`UPDATE compliance_visits SET items=$1 WHERE id=$2`, [JSON.stringify(changed), row.id]);
      return true;
    }
    // If compliance_visits didn't exist or didn't have items, try normalized table
    const altTableCandidates = ['store_compliance_data', 'store_compliance_items', 'store_visit_items'];
    for (const tbl of altTableCandidates) {
      const tcols = await getTableColumns(tbl);
      if (!tcols || !tcols.length) continue;

      // If table has an item identifier column, update that row
      const itemCol = tcols.find(c => ['item_id','itemid','checklist_item_id','checklist_item','item'].includes(c));
      const statusCol = tcols.find(c => ['status','item_status','visit_status'].includes(c));
      const storeCol = tcols.find(c => ['store_id','storeid','store'].includes(c));
      const visitCol = tcols.find(c => ['visit_date','visitdate','date'].includes(c));

      if (storeCol && visitCol && statusCol && itemCol) {
        // Update specific item row
        const sql = `UPDATE ${tbl} SET ${statusCol}=$1 WHERE ${storeCol}=$2 AND (${visitCol}::text LIKE $3 OR ${visitCol}=$4) AND ${itemCol}=$5 RETURNING *`;
        const res = await pool.query(sql, [status, storeId, `${visitDate}%`, visitDate, itemId]);
        if (res.rowCount > 0) return true;
      }

      if (storeCol && visitCol && statusCol && !itemCol) {
        // Table records status at visit level: update that row's status
        const sql = `UPDATE ${tbl} SET ${statusCol}=$1 WHERE ${storeCol}=$2 AND (${visitCol}::text LIKE $3 OR ${visitCol}=$4)`;
        await pool.query(sql, [status, storeId, `${visitDate}%`, visitDate]);
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('updateVisitItemStatus error', err);
    return false;
  }
}

// Update by visit primary key id (more robust if frontend provides visit id)
export async function updateVisitItemStatusByVisitId(visitId: string | number, itemId: string, status: ComplianceStatus): Promise<boolean> {
  try {
    // Try compliance_visits JSONB
    const cols = await getTableColumns('compliance_visits');
    if (cols.includes('items')) {
      const res = await pool.query(`SELECT * FROM compliance_visits WHERE id=$1 LIMIT 1`, [visitId]);
      const row = res.rows[0];
      if (!row) return false;
      let items: any[] = [];
      try { items = typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []); } catch (err) { items = row.items || []; }
      const changed = items.map(it => ({ ...it, status: (it.itemId === itemId || it.item_id === itemId || it.id === itemId) ? status : it.status }));
      await pool.query(`UPDATE compliance_visits SET items=$1 WHERE id=$2`, [JSON.stringify(changed), visitId]);
      return true;
    }

    // Try normalized table store_compliance_data with id column
    const altCols = await getTableColumns('store_compliance_data');
    if (altCols && altCols.length) {
      // If this table stores per-item rows, itemId may match id
      const itemCol = altCols.find(c => ['item_id','itemid','checklist_item_id','checklist_item','item','id'].includes(c));
      const statusCol = altCols.find(c => ['status','item_status','visit_status'].includes(c));
      if (statusCol) {
        // update by id if itemId matches a row id
        const res2 = await pool.query(`UPDATE store_compliance_data SET ${statusCol}=$1 WHERE id=$2 RETURNING *`, [status, visitId]);
        if (res2.rowCount > 0) return true;
      }
    }

    return false;
  } catch (err) {
    console.error('updateVisitItemStatusByVisitId error', err);
    return false;
  }
}

export async function deleteScheduledVisit(storeId: string, visitDate: string): Promise<boolean> {
  try {
    // Try delete by store_id and visit_date
    await pool.query(`DELETE FROM compliance_visits WHERE store_id=$1 AND (visit_date::text LIKE $2 OR visit_date=$3)`, [storeId, `${visitDate}%`, visitDate]);
    return true;
  } catch (err) {
    console.error('deleteScheduledVisit error', err);
    return false;
  }
}
