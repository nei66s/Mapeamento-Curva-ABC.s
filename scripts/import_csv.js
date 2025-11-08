#!/usr/bin/env node
const fs = require('fs');
const { parse } = require('csv-parse');
const { Client } = require('pg');

function parseArg(nameShort, nameLong) {
  const idxShort = process.argv.indexOf(nameShort);
  if (idxShort !== -1 && process.argv.length > idxShort + 1) return process.argv[idxShort + 1];
  const idxLong = process.argv.indexOf(nameLong);
  if (idxLong !== -1 && process.argv.length > idxLong + 1) return process.argv[idxLong + 1];
  return undefined;
}

const host = parseArg('-h','--host') || 'localhost';
const user = parseArg('-U','--user') || 'postgres';
const database = parseArg('-d','--db') || 'mydb';
const port = parseArg('-p','--port') ? parseInt(parseArg('-p','--port'),10) : 5432;
const file = parseArg('-f','--file') || '../sql/lancamentos_sample.csv';
const batchSize = parseInt(parseArg('--batch') || '200', 10);
const password = process.env.PGPASSWORD || parseArg('--password');

if (!fs.existsSync(file)) {
  console.error('Arquivo CSV não encontrado:', file);
  process.exit(1);
}
if (!password) {
  console.error('ERRO: senha não fornecida. Defina PGPASSWORD ou passe --password');
  process.exit(1);
}

const client = new Client({ host, port, user, database, password });

function normalizeRow(r) {
  // Expected headers: conta_id,categoria_id,tipo,descricao,valor,moeda,data_lancamento,data_vencimento,recorrente,status,metadata,created_by,referencia
  return {
    conta_id: r.conta_id || null,
    categoria_id: r.categoria_id || null,
    tipo: r.tipo || null,
    descricao: r.descricao || null,
    valor: r.valor ? parseFloat(r.valor) : null,
    moeda: r.moeda || 'BRL',
    data_lancamento: r.data_lancamento || null,
    data_vencimento: r.data_vencimento || null,
    recorrente: r.recorrente ? (r.recorrente.toLowerCase() === 'true' || r.recorrente === '1') : false,
    status: r.status || 'PENDENTE',
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
    created_by: r.created_by || null,
    referencia: r.referencia || null
  };
}

async function run() {
  await client.connect();
  console.log('Conectado a', database);

  const parser = fs.createReadStream(file).pipe(parse({ columns: true, skip_empty_lines: true }));
  let batch = [];
  let total = 0;

  for await (const record of parser) {
    try {
      const row = normalizeRow(record);
      batch.push(row);
      if (batch.length >= batchSize) {
        await flushBatch(batch);
        total += batch.length;
        console.log('Imported rows:', total);
        batch = [];
      }
    } catch (err) {
      console.error('Erro ao processar linha:', err.message || err);
    }
  }
  if (batch.length > 0) {
    await flushBatch(batch);
    total += batch.length;
    console.log('Imported rows:', total);
  }

  await client.end();
  console.log('Import completo. Total:', total);
  process.exit(0);
}

async function flushBatch(batch) {
  // Prepare INSERT with parameterized values
  const cols = ['conta_id','categoria_id','tipo','descricao','valor','moeda','data_lancamento','data_vencimento','recorrente','status','metadata','created_by','referencia'];
  const values = [];
  const placeholders = batch.map((r, i) => {
    const base = i * cols.length;
    cols.forEach((c, j) => {
      let v = r[c];
      if (c === 'metadata') v = JSON.stringify(v || {});
      values.push(v);
    });
    const ph = cols.map((_, j) => `$${base + j + 1}`).join(',');
    return `(${ph})`;
  }).join(',');

  const text = `INSERT INTO public.lancamentos_mensais (${cols.join(',')}) VALUES ${placeholders};`;
  await client.query('BEGIN');
  try {
    await client.query(text, values);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao inserir batch:', err.message || err);
    throw err;
  }
}

run().catch(err => {
  console.error('Erro:', err.message || err);
  process.exit(2);
});
