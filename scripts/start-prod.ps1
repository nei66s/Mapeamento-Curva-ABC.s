if (-not [string]::IsNullOrEmpty($env:DATABASE_URL) -or -not [string]::IsNullOrEmpty($env:PGHOST) -or -not [string]::IsNullOrEmpty($env:PGDATABASE) -or -not [string]::IsNullOrEmpty($env:PGUSER)) {
	npx ts-node scripts/seed-vacations-for-test.ts
	npx ts-node scripts/list-vacations.ts
} else {
	Write-Host "DB env not configured (set DATABASE_URL or PG* vars) - skipping seed scripts."
}
npm run build
if ($LASTEXITCODE -ne 0) {
	Write-Error "Build failed; aborting start."
	exit 1
}

if (-not (Test-Path ".next\routes-manifest.json")) {
	Write-Error ".next/routes-manifest.json missing after build; aborting."
	exit 1
}

npm start
