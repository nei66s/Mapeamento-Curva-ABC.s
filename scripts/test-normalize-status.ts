import { normalizeStatus } from '../src/lib/compliance.server';

type Case = { in: any; out: string };

const cases: Case[] = [
  { in: 'Concluído', out: 'completed' },
  { in: 'concluido', out: 'completed' },
  { in: 'Completed', out: 'completed' },
  { in: 'Pendente', out: 'pending' },
  { in: 'Não aplicável', out: 'not-applicable' },
  { in: 'nao aplicavel', out: 'not-applicable' },
  { in: null, out: 'pending' },
  { in: undefined, out: 'pending' },
  { in: 'not-applicable', out: 'not-applicable' },
];

let failed = 0;
for (const c of cases) {
  const got = normalizeStatus(c.in);
  if (got !== c.out) {
    console.error(`FAIL: input=${JSON.stringify(c.in)} expected=${c.out} got=${got}`);
    failed++;
  } else {
    console.log(`ok: input=${JSON.stringify(c.in)} -> ${got}`);
  }
}

if (failed > 0) {
  console.error(`${failed} tests failed`);
  process.exit(1);
} else {
  console.log('All tests passed');
  process.exit(0);
}
