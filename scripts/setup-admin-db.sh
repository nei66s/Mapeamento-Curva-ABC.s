#!/usr/bin/env bash
set -euo pipefail

PSQL_CMD="${PSQL_CMD:-psql}"
NODE_CMD="${NODE_CMD:-npx}"

BASE_SQL=(
  "sql/create-admin-tables.sql"
  "sql/seed-admin-modules-and-flags.sql"
)

TS_SCRIPTS=(
  "scripts/seed-admin-modules.ts"
  "scripts/seed-admin-demo-data.ts"
)

echo "👉 Running admin schema + seed SQL..."
for FILE in "${BASE_SQL[@]}"; do
  echo "  ↳ Applying $FILE"
  "${PSQL_CMD}" --set ON_ERROR_STOP=1 -f "$FILE"
done

echo "👉 Running TypeScript seeds via ts-node..."
for SCRIPT in "${TS_SCRIPTS[@]}"; do
  if [ ! -f "$SCRIPT" ]; then
    echo "  ⚠️  Missing script $SCRIPT, skipping."
    continue
  fi
  echo "  ↳ $SCRIPT"
  "${NODE_CMD}" ts-node "$SCRIPT"
done

echo "✅ Admin setup complete. Re-run dev server / admin-e2e to confirm."
