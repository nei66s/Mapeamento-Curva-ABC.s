$portOpen = (Test-NetConnection -ComputerName 'localhost' -Port 5432).TcpTestSucceeded
if ($portOpen) {
	Write-Host "Postgres is reachable on localhost:5432 — running seed scripts..."
	npx ts-node scripts/seed-vacations-for-test.ts
	npx ts-node scripts/list-vacations.ts
} else {
	Write-Host "Postgres not reachable on localhost:5432 — skipping seed scripts."
}

	npx next dev -p 9002