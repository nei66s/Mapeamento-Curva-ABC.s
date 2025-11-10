import { exec } from 'child_process';
import { promisify } from 'util';
import { test, expect } from 'vitest';

const run = promisify(exec);

// This test runs the existing script that aggregates indicadores_lancamentos
// and should exit 0 when the DB is reachable and data exists. It is
// guarded by the RUN_INDICATORS_TEST env var so it doesn't run in CI
// by default when DB credentials are not present.
const shouldRun = process.env.RUN_INDICATORS_TEST === '1';

const runner = shouldRun ? test : test.skip;

runner('check indicators script runs without error', async () => {
  const { stdout, stderr } = await run('npx ts-node scripts/check-indicators.ts', { timeout: 60_000 });
  if (stderr) console.error(stderr);
  expect(stdout).toBeTruthy();
});
