# Helper to run project migrations with sensible env mapping
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts\run-migrations.ps1

function Write-Info($msg) { Write-Host "[info] $msg" -ForegroundColor Cyan }
function Write-Warn($msg) { Write-Host "[warn] $msg" -ForegroundColor Yellow }
function Write-Err($msg) { Write-Host "[err] $msg" -ForegroundColor Red }

Write-Info "Checking environment for DATABASE_URL or SUPABASE DB vars..."

if (-not $env:DATABASE_URL) {
    if ($env:SUPABASE_DB_URL) {
        Write-Info "Found SUPABASE_DB_URL — mapping to DATABASE_URL"
        $env:DATABASE_URL = $env:SUPABASE_DB_URL
    } elseif ($env:SUPABASE_URL -and $env:SUPABASE_SERVICE_ROLE_KEY) {
        # Try to derive postgres connection if SUPABASE_DB_URL not present
        Write-Warn "SUPABASE_URL present but SUPABASE_DB_URL not set — cannot auto-derive DATABASE_URL from Supabase HTTP URL."
    }
}

if (-not $env:DATABASE_URL) {
    Write-Warn "DATABASE_URL not set. You can paste a Postgres connection string now (format: postgresql://user:pass@host:5432/dbname)"
    $input = Read-Host -Prompt "Enter DATABASE_URL (leave empty to abort)"
    if (-not $input) {
        Write-Err "No DATABASE_URL provided — aborting."
        exit 1
    }
    $env:DATABASE_URL = $input
}

Write-Info "DATABASE_URL will be used to run migrations (hidden)."
$confirmed = Read-Host -Prompt "Run migrations now? (y/N)"
if ($confirmed -ne 'y' -and $confirmed -ne 'Y') {
    Write-Info "Aborting as requested."
    exit 0
}

Write-Info "Running: npm run migrate:all"
$rc = & npm run migrate:all
if ($LASTEXITCODE -ne 0) {
    Write-Err "migrate:all finished with exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Info "Migrations completed successfully."
exit 0
