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

# Determine whether Test-NetConnection supports -Quiet, fall back otherwise
if ((Get-Command Test-NetConnection).Parameters.Keys -contains 'Quiet') {
	$portOpen = Test-NetConnection -ComputerName $dbHost -Port ([int]$dbPort) -Quiet
} else {
	$portOpen = (Test-NetConnection -ComputerName $dbHost -Port ([int]$dbPort)).TcpTestSucceeded
}

# Forcefully unset NODE_TLS_REJECT_UNAUTHORIZED in the process environment to avoid
# Node emitting the insecure-TLS warning for child processes.
$originalTls = [System.Environment]::GetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', 'Process')
if ($null -ne $originalTls) {
	[System.Environment]::SetEnvironmentVariable('NODE_TLS_REJECT_UNAUTHORIZED', $null, 'Process')
}
if ($portOpen) {
	Write-Host "Database is reachable on ${dbHost}:${dbPort} - running seed scripts..."
	npx ts-node scripts/seed-vacations-for-test.ts
	npx ts-node scripts/list-vacations.ts
} else {
	Write-Host "Database not reachable on ${dbHost}:${dbPort} - skipping seed scripts."
}

	# Ensure build artifacts exist (some tooling expects routes-manifest.json)
	if (-not (Test-Path '.next/routes-manifest.json')) {
		Write-Host '.next/routes-manifest.json not found - running npm run build to generate artifacts...'
		npm run build
		if ($LASTEXITCODE -ne 0) {
			Write-Error 'Build failed; aborting dev start.'
			exit 1
		}
	}

	npx next dev -p 9002