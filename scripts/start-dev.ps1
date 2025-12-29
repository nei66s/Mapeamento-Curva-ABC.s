# Prefer explicit PGHOST/PGPORT when provided, otherwise try to parse DATABASE_URL.
# Use distinct variable names to avoid clobbering PowerShell automatic variables like $Host.
$dbHost = $env:PGHOST
$dbPort = $env:PGPORT
if ([string]::IsNullOrEmpty($dbHost) -and -not [string]::IsNullOrEmpty($env:DATABASE_URL)) {
	try {
		$uri = [System.Uri]::new($env:DATABASE_URL)
		$dbHost = $uri.Host
		if ($uri.Port -gt 0) { $dbPort = $uri.Port.ToString() }
	} catch {
		# ignore parse errors and fall back to localhost
	}
}
if ([string]::IsNullOrEmpty($dbHost)) { $dbHost = 'localhost' }
if ([string]::IsNullOrEmpty($dbPort)) { $dbPort = '5432' }

function Test-DbConfigured {
	if (-not [string]::IsNullOrEmpty($env:DATABASE_URL)) { return $true }
	# Require at least a minimal set of PG* vars; otherwise the app's DB layer
	# intentionally refuses to query to avoid accidental use.
	if (
		-not [string]::IsNullOrEmpty($env:PGHOST) -or
		-not [string]::IsNullOrEmpty($env:PGPORT) -or
		-not [string]::IsNullOrEmpty($env:PGUSER) -or
		-not [string]::IsNullOrEmpty($env:PGPASSWORD) -or
		-not [string]::IsNullOrEmpty($env:PGDATABASE)
	) { return $true }
	return $false
}

$dbConfigured = Test-DbConfigured
if (-not $dbConfigured) {
	Write-Host "DB env not configured (set DATABASE_URL or PG* vars) - skipping seed scripts."
} else {
	$portOpen = (Test-NetConnection -ComputerName $dbHost -Port ([int]$dbPort)).TcpTestSucceeded
	if ($portOpen) {
		Write-Host "Database is reachable on ${dbHost}:${dbPort} - running seed scripts..."
		npx ts-node scripts/seed-vacations-for-test.ts
		npx ts-node scripts/list-vacations.ts
	} else {
		Write-Host "Database not reachable on ${dbHost}:${dbPort} - skipping seed scripts."
	}
}

	# In dev, Next.js can start without a production build. Avoid forcing `npm run build`
	# here because the production build may require DB credentials (and other prod-only env).
	npx next dev -p 9002