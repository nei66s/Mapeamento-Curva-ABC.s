# PowerShell script to apply recommended indexes for suppliers
# Usage: Open PowerShell and run: .\scripts\apply-indexes.ps1 -ConnectionString "Host=localhost;Username=postgres;Password=admin;Database=postgres"
param(
  [string]$ConnectionString = "Host=localhost;Username=postgres;Password=admin;Database=postgres"
)

$psql = "psql"
$commands = @(
"CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers (name);",
"CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON suppliers (cnpj);",
"CREATE INDEX IF NOT EXISTS idx_suppliers_contact_email ON suppliers (contact_email);"
)

foreach ($cmd in $commands) {
  Write-Host "Applying: $cmd"
  & $psql "$ConnectionString" -c $cmd
}

Write-Host "Done. Verify indexes in your DB (\"\d suppliers\" in psql)." 
