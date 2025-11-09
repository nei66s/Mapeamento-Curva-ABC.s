# PowerShell helper to refresh mv_saldo_mensal via Node script
# Usage: set PGPASSWORD in the session and run this script, or edit to include credentials
# Example:
# $env:PGPASSWORD = 'admin'
# .\refresh_mv_saldo_mensal.ps1 -Host localhost -User postgres -Db mydb -Concurrently

param(
  [string]$Host = 'localhost',
  [string]$User = 'postgres',
  [string]$Db = 'mydb',
  [switch]$Concurrently
)

$flag = ''
if ($Concurrently) { $flag = '--concurrently' }

Write-Host "Refreshing materialized view on $Host/$Db (concurrently=$Concurrently)"
node .\refresh_mv_saldo_mensal.js --host $Host --user $User --db $Db $flag

