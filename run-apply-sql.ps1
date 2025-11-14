$env:PGPASSWORD = 'admin'
$env:PGUSER = 'postgres'
$env:PGDATABASE = 'postgres'
$env:PGHOST = 'localhost'
$env:PGPORT = '5432'
Write-Output "Running apply-stores-sql.js with DATABASE=$($env:PGDATABASE) user=$($env:PGUSER) host=$($env:PGHOST):$($env:PGPORT)"
node .\scripts\apply-stores-sql.js stores-update-latlng.sql
