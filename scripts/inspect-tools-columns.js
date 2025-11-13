#!/usr/bin/env node
const { Client } = require('pg');

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

const host = parseArg('-h','--host') || process.env.PGHOST || 'localhost';
const user = parseArg('-U','--user') || process.env.PGUSER || 'postgres';
const database = parseArg('-d','--db') || process.env.PGDATABASE || 'postgres';
const port = parseArg('-p','--port') ? parseInt(parseArg('-p','--port'),10) : (process.env.PGPORT ? Number(process.env.PGPORT) : 5432);
const password = process.env.PGPASSWORD;

if (!password) {
  console.error('Please set PGPASSWORD in the environment before running this script.');
  process.exit(2);
}

const client = new Client({ host, port, user, database, password });
(async () => {
  try {
    await client.connect();
    const res = await client.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='tools' ORDER BY ordinal_position");
    if (res.rowCount === 0) {
      console.log('No columns found for table "tools". The table may not exist in this database/schema.');
    } else {
      console.log('Columns for table "tools":');
      for (const r of res.rows) {
        console.log(`- ${r.column_name} (${r.data_type}) nullable=${r.is_nullable}`);
      }
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error inspecting tools columns:', err.message || err);
    try { await client.end(); } catch(e){}
    process.exit(3);
  }
})();
