<#
  Dev setup helper (PowerShell)
  Usage (PowerShell):
    .\scripts\dev-setup.ps1

  This script exports a safe local PGPASSWORD for development and optionally
  sets DEV_ALLOW_DEFAULT_PG_PASSWORD so the local app can use the 'admin' fallback.
  It does NOT change production configuration.
#>

Write-Host 'Setting development Postgres password (PGPASSWORD=admin) for this session'
$env:PGPASSWORD = 'admin'
Write-Host 'To allow the application to use the default development fallback set DEV_ALLOW_DEFAULT_PG_PASSWORD=true'
$env:DEV_ALLOW_DEFAULT_PG_PASSWORD = 'true'
Write-Host 'Now run: npm run dev'
