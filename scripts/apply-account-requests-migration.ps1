<#
Applies the `sql/migrate-add-account-requests.sql` migration to the target Postgres database.

Usage:
  - Ensure `psql` is available in PATH (Postgres client).
  - Set `DATABASE_URL` env var (preferred) or set PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE.
  - Run in PowerShell:
      .\scripts\apply-account-requests-migration.ps1

This script does NOT store credentials. It will fail if connection params are missing.
#>

$scriptPath = Join-Path $PSScriptRoot "..\sql\migrate-add-account-requests.sql"
if (-not (Test-Path $scriptPath)) {
    Write-Error "Migration file not found at: $scriptPath"
    exit 1
}

# Build psql connection string
if ($env:DATABASE_URL) {
    $conn = $env:DATABASE_URL
    Write-Output "Using DATABASE_URL from environment."
    & psql $conn -f $scriptPath
    exit $LASTEXITCODE
}

# Use safe variable names to avoid colliding with PowerShell automatic vars
$pgHost = $env:PGHOST
$pgPort = $env:PGPORT
$pgUser = $env:PGUSER
$pgPass = $env:PGPASSWORD
$pgDb   = $env:PGDATABASE

if (-not $pgHost -or -not $pgUser -or -not $pgDb) {
    Write-Error "Missing connection info. Set DATABASE_URL or PGHOST/PGUSER/PGDATABASE (and PGPASSWORD if required)."
    exit 1
}

$psqlArgs = @()
if ($pgHost) { $psqlArgs += "-h"; $psqlArgs += $pgHost }
if ($pgPort) { $psqlArgs += "-p"; $psqlArgs += $pgPort }
if ($pgUser) { $psqlArgs += "-U"; $psqlArgs += $pgUser }
$psqlArgs += "-d"; $psqlArgs += $pgDb
$psqlArgs += "-f"; $psqlArgs += $scriptPath

if ($pgPass) {
    # Export PGPASSWORD for this process only
    $env:PGPASSWORD = $pgPass
}

Write-Output "Running: psql $($psqlArgs -join ' ')"
& psql @psqlArgs
exit $LASTEXITCODE
