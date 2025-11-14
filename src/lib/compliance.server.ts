import pool from './db';
import type { ComplianceChecklistItem, StoreComplianceData, ComplianceStatus } from './types';

// Quote an SQL identifier (table or column) safely. We only accept
// simple identifiers composed of letters, numbers and underscore to
// avoid SQL injection via interpolated identifiers.
function quoteIdent(name: string): string {
  if (!name || typeof name !== 'string') throw new Error('Invalid identifier');
  // Allow only a-z, A-Z, 0-9 and underscore
  if (!/^[A-Za-z0-9_]+$/.test(name)) {
    throw new Error(`Invalid identifier: ${name}`);
  }
  // Double-quote and escape any double quotes (shouldn't be present due to regex)
  return `"${name.replace(/"/g, '""')}"`;
}

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

export function normalizeStatus(s: any): ComplianceStatus {
  if (s == null) return 'pending';
  const str = String(s).trim().toLowerCase();
  if (str === 'completed' || str === 'concluído' || str === 'concluido' || str.includes('concl')) return 'completed';
  if (str === 'not-applicable' || str === 'não aplicável' || str === 'nao aplicavel' || str.includes('não') || str.includes('nao') || str.includes('not-app')) return 'not-applicable';
  return 'pending';
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
        return [];
      }
    } catch (__) {
      // fall through to rethrow
    }
    // For unexpected errors, rethrow so callers can handle failures explicitly
    throw err;
  }
}

export async function addChecklistItem(item: { name: string; classification?: string }): Promise<ComplianceChecklistItem | null> {
  try {
    const cols = await getTableColumns('compliance_checklist_items');
    // If the checklist table is missing or has no detectable columns, return a generated fallback
    if (!cols || !cols.length) {
      return { id: `CHK-${Date.now()}`, name: item.name, classification: item.classification ?? 'C' } as ComplianceChecklistItem;
    }
    if (cols && cols.length) {
  const nameCol = cols.find(c => ['name','item_name','label'].includes(c)) || 'name';
  const classCol = cols.find(c => ['classification','class'].includes(c));
  const idCol = cols.find(c => ['id','item_id'].includes(c)) || 'id';
  // Quote identifiers
  const quotedNameCol = quoteIdent(nameCol);
  const quotedClassCol = classCol ? quoteIdent(classCol) : '';
  const sql = `INSERT INTO ${quoteIdent('compliance_checklist_items')} (${quotedNameCol}${classCol ? ',' + quotedClassCol : ''}) VALUES ($1${classCol ? ', $2' : ''}) RETURNING *`;
      const params = classCol ? [item.name, item.classification ?? 'C'] : [item.name];
      const res = await pool.query(sql, params);
      const row = res.rows[0];
      if (!row) return null;
      return {
        id: String(row[idCol] ?? row.id ?? row.item_id ?? ''),
        name: pickRow(row, { keys: [nameCol, 'name', 'item_name', 'label'], asString: true }) || '',
        classification: (pickRow(row, { keys: [classCol || 'classification', 'class'], asString: true }) || 'C') as any,
      } as ComplianceChecklistItem;
    }
    // Defensive: ensure a value is returned on all code paths
    return null;
  } catch (err) {
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('addChecklistItem: table missing compliance_checklist_items — returning generated fallback');
        return { id: `CHK-${Date.now()}`, name: item.name, classification: item.classification ?? 'C' } as ComplianceChecklistItem;
      }
    } catch (__){
      // fall through to rethrow
    }
    throw err;
  }
}

export async function deleteChecklistItem(itemId: string): Promise<boolean> {
  try {
    const cols = await getTableColumns('compliance_checklist_items');
    if (cols && cols.length) {
      // Build a WHERE clause only using columns that actually exist to avoid SQL errors
    const candidates = ['id','item_id','itemid','name','item_name','label'];
    const present = candidates.filter(c => cols.includes(c));
    if (!present.length) return false;
  // Cast both sides to text to avoid operator type mismatches (int vs varchar)
  const where = present.map(c => `${quoteIdent(c)}::text = $1::text`).join(' OR ');
  const sql = `DELETE FROM ${quoteIdent('compliance_checklist_items')} WHERE ${where} RETURNING *`;
      const res = await pool.query(sql, [itemId]);
      return res.rowCount > 0;
    }
  } catch (err) {
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('deleteChecklistItem: table missing compliance_checklist_items');
        return false;
      }
    } catch (__) {
      // fall through
    }
    throw err;
  }
  return false;
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
        items: items.map((it: any) => ({ itemId: String(it.itemId || it.id || it.item_id || ''), status: normalizeStatus(it.status || it.state || it.status_description) })) as any,
      } as StoreComplianceData;
      });
    }

    // If no denormalized table rows, try an alternative normalized table that stores per-visit or per-item rows
    const altCols = await getTableColumns('store_compliance_data');
    if (altCols && altCols.length) {
      try {
        const r2 = await pool.query(`SELECT * FROM store_compliance_data`);
        if (!r2.rows || !r2.rows.length) return [];

        // Aggregate rows by storeId + visitDate so we return one StoreComplianceData per store visit
        const map = new Map<string, StoreComplianceData>();
        for (const row of r2.rows) {
          const storeId = pickRow(row, { keys: ['store_id','storeid','store'], asString: true }) || '';
          const storeName = pickRow(row, { keys: ['store_name','storename'], asString: true }) || storeId;
          const visitDateRaw = pickRow(row, { keys: ['visit_date','visitdate','date'], asString: false });
          const visitDate = toIso(visitDateRaw);

          const itemId = String(pickRow(row, { keys: ['item_id','itemid','checklist_item_id','id'], asString: true }) || row.id || '');
          const status = normalizeStatus(pickRow(row, { keys: ['status','item_status','visit_status','state'], asString: true }) || 'pending');

          const key = `${storeId}||${visitDate}`;
          const existing = map.get(key);
          if (existing) {
            // append item
            existing.items.push({ itemId, status } as any);
          } else {
            map.set(key, {
              storeId,
              storeName,
              visitDate,
              items: [{ itemId, status } as any],
            } as StoreComplianceData);
          }
        }

        return Array.from(map.values());
      } catch (err) {
        // ignore and fall through
      }
    }

    return [];
  } catch (err) {
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('listScheduledVisits: table missing compliance_visits');
        return [];
      }
    } catch (__) {
      // fall through
    }
    throw err;
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

    const finalCols = Object.keys(mapping || {});
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
  const quotedCols = finalCols.map(c => quoteIdent(c));
  const sql = `INSERT INTO ${quoteIdent('compliance_visits')} (${quotedCols.join(',')}) VALUES (${finalCols.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`;
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
      items: items.map((it: any) => ({ itemId: String(it.itemId || it.id || it.item_id || ''), status: normalizeStatus(it.status || it.state || it.status_description) })) as any,
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
          const quotedStore = quoteIdent(storeCol);
          const quotedVisit = quoteIdent(visitCol);
          const quotedStatus = quoteIdent(statusCol || 'status');
          const sql2 = `INSERT INTO ${quoteIdent('store_compliance_data')} (${quotedStore}, ${quotedVisit}, ${quotedStatus}) VALUES ($1, $2, $3) RETURNING *`;
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
      try { console.error('scheduleVisit fallback error', err2); } catch(_) {}
    }
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('scheduleVisit: compliance_visits missing and fallback attempted');
        return null;
      }
    } catch (__) {
      // fall through
    }
    throw err;
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
      const changed = items.map(it => {
        const key = String(it?.itemId ?? it?.item_id ?? it?.id ?? '');
        return { ...it, status: key === String(itemId) ? status : it.status };
      });
        // Attempt to update using a detected primary/key column. Many schemas use 'id' but others may use 'visit_id' or similar.
        const idCandidates = ['id', 'visit_id', 'visitid', 'visitid_pk'];
        const idCol = cols.find(c => idCandidates.includes(c)) || (Object.prototype.hasOwnProperty.call(row, 'id') ? 'id' : undefined);
        if (idCol && row[idCol] != null) {
          const qId = quoteIdent(idCol);
          const resUpd = await pool.query(`UPDATE ${quoteIdent('compliance_visits')} SET items=$1 WHERE ${qId}=$2 RETURNING *`, [JSON.stringify(changed), row[idCol]]);
          return resUpd.rowCount > 0;
        }

        // Fallback: update by store_id + visit_date if no id-like column present
        const resFallback = await pool.query(`UPDATE ${quoteIdent('compliance_visits')} SET items=$1 WHERE store_id=$2 AND (visit_date::text LIKE $3 OR visit_date=$4)`, [JSON.stringify(changed), storeId, `${visitDate}%`, visitDate]);
        return resFallback.rowCount > 0;
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
        // Update specific item row (cast to text to avoid int/text mismatches)
        const qTbl = quoteIdent(tbl);
        const qStatus = quoteIdent(statusCol);
        const qStore = quoteIdent(storeCol);
        const qVisit = quoteIdent(visitCol);
        const qItem = quoteIdent(itemCol);
        const sql = `UPDATE ${qTbl} SET ${qStatus}=$1 WHERE ${qStore}=$2 AND (${qVisit}::text LIKE $3 OR ${qVisit}=$4) AND ${qItem}::text = $5::text RETURNING *`;
        const res = await pool.query(sql, [status, storeId, `${visitDate}%`, visitDate, itemId]);
        if (res.rowCount > 0) return true;
      }

      if (storeCol && visitCol && statusCol && !itemCol) {
        // Table records status at visit level: update that row's status
        const qTbl = quoteIdent(tbl);
        const qStatus = quoteIdent(statusCol);
        const qStore = quoteIdent(storeCol);
        const qVisit = quoteIdent(visitCol);
        const sql = `UPDATE ${qTbl} SET ${qStatus}=$1 WHERE ${qStore}=$2 AND (${qVisit}::text LIKE $3 OR ${qVisit}=$4)`;
        await pool.query(sql, [status, storeId, `${visitDate}%`, visitDate]);
        return true;
      }
    }
    return false;
  } catch (err) {
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('updateVisitItemStatus: tables missing for update');
        return false;
      }
    } catch (__) {}
    throw err;
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
      const changed = items.map(it => {
        const key = String(it?.itemId ?? it?.item_id ?? it?.id ?? '');
        return { ...it, status: key === String(itemId) ? status : it.status };
      });
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
        const qStatus = quoteIdent(statusCol);
        const sql = `UPDATE ${quoteIdent('store_compliance_data')} SET ${qStatus}=$1 WHERE id=$2 RETURNING *`;
        const res2 = await pool.query(sql, [status, visitId]);
        if (res2.rowCount > 0) return true;
      }
    }

    return false;
  } catch (err) {
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('updateVisitItemStatusByVisitId: tables missing for update');
        return false;
      }
    } catch (__) {}
    throw err;
  }
}

export async function deleteScheduledVisit(storeId: string, visitDate: string): Promise<boolean> {
  try {
    // Try delete by store_id and visit_date
    await pool.query(`DELETE FROM compliance_visits WHERE store_id=$1 AND (visit_date::text LIKE $2 OR visit_date=$3)`, [storeId, `${visitDate}%`, visitDate]);
    return true;
  } catch (err) {
    try {
      if ((err as any)?.code === '42P01') {
        console.debug('deleteScheduledVisit: compliance_visits missing');
        return false;
      }
    } catch (__) {}
    throw err;
  }
}
