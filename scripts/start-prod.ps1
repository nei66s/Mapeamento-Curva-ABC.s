npx ts-node scripts/seed-vacations-for-test.ts
npx ts-node scripts/list-vacations.ts
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
