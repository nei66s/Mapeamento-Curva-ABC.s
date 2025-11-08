#!/usr/bin/env ts-node
import path from 'path';

// garantir que TS path aliases funcionem com ts-node ao usar imports relativos
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

async function main() {
  try {
    // importar dinamicamente para evitar resolver aliases estranhos
    const mod = await import('../src/lib/lancamentos.server');
    const sync = mod.syncLancamentos || mod.default?.syncLancamentos;
    if (!sync) {
      console.error('Não foi possível localizar syncLancamentos em src/lib/lancamentos.server');
      process.exit(2);
    }

    console.log('Iniciando sincronização de lançamentos...');
    const result = await sync();
    console.log('Resultado da sincronização:', result);
    process.exit(0);
  } catch (err) {
    console.error('Erro ao executar sync:', err);
    process.exit(1);
  }
}

main();
