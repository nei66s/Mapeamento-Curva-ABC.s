param(
  [string]$DbHost = 'localhost',
  [int]$DbPort = 5432,
  [string]$DbUser = 'postgres',
  [string]$DbName = 'your_db',
  [System.Management.Automation.PSCredential]$DbCredential,
  [System.Security.SecureString]$DbPasswordSecure,
  [int]$ApiPort = 9002,
  [switch]$UpsertAdmin
)

# Usage examples:
# 1) Pass a credential object (recommended):
#    $cred = Get-Credential -UserName postgres -Message "Enter DB password"; .\check-admin-user.ps1 -DbHost localhost -DbPort 5432 -DbName mydb -DbCredential $cred -ApiPort 9002
# 2) Pass a secure string directly (script will prompt if not provided):
#    $pw = Read-Host -AsSecureString -Prompt 'DB password'; .\check-admin-user.ps1 -DbHost localhost -DbPort 5432 -DbName mydb -DbPasswordSecure $pw -ApiPort 9002
# 3) Interactive prompt (no password parameters): script will prompt securely for DB password.

Write-Host "Running DB + API checks against ${DbUser}@${DbHost}:${DbPort}/${DbName} (Next API port: ${ApiPort})"

function Convert-SecureToPlain([System.Security.SecureString]$s) {
  if (-not $s) { return '' }
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)
  try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) } finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
}

# Resolve plain password from credential or secure string, prompting interactively if none provided
if ($DbCredential) {
  $plainPassword = $DbCredential.GetNetworkCredential().Password
} elseif ($DbPasswordSecure) {
  $plainPassword = Convert-SecureToPlain $DbPasswordSecure
} else {
  Write-Host 'No DB credential provided. Prompting for DB password (secure input)'
  $in = Read-Host -AsSecureString -Prompt 'DB password'
  $plainPassword = Convert-SecureToPlain $in
}

# Ensure PGPASSWORD is set for psql (use plain only for process env; avoid keeping it elsewhere)
$env:PGPASSWORD = $plainPassword

function ExecSql([string]$q) {
  Write-Host "\n=== SQL ==="
  Write-Host $q
  try {
    & psql -h $DbHost -p $DbPort -U $DbUser -d $DbName -c $q
  } catch {
    Write-Host "psql failed: $_" -ForegroundColor Red
  }
}

# 0) Quick sanity: show connection info
Write-Host "\n--- Connection info ---"
Write-Host "PGHOST=$Host  PGPORT=$Port  PGUSER=$User  PGDATABASE=$Db"

# 1) Check existence of relevant tables

if (Get-Command psql -ErrorAction SilentlyContinue) {
  ExecSql "SELECT to_regclass('public.users') AS users_table, to_regclass('public.roles') AS roles_table, to_regclass('public.user_roles') AS user_roles_table, to_regclass('public.user_profile') AS user_profile_table;"

  # 2) Count users and sample
  ExecSql "SELECT count(*) AS user_count FROM users;"
  ExecSql "SELECT id, name, email, role, created_at, status FROM users ORDER BY created_at DESC LIMIT 50;"

  # 3) Search for admin by email or role
  ExecSql "SELECT id, name, email, role, created_at FROM users WHERE email ILIKE '%admin%' OR role ILIKE 'admin';"

  # 4) Roles and mapping
  ExecSql "SELECT id, name FROM roles ORDER BY id;"
  ExecSql "SELECT u.id AS user_id, u.email, ur.role_id, r.name AS role_name FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id::text LEFT JOIN roles r ON r.id::text = ur.role_id WHERE u.email ILIKE '%admin%' OR r.name ILIKE 'admin';"

  # 5) Check user_profile contents for admin if table exists
  ExecSql "SELECT to_regclass('public.user_profile') AS user_profile_reg;"
  ExecSql "SELECT up.user_id, up.extra FROM user_profile up LIMIT 20;"
} else {
  Write-Host "psql not found on PATH — using Node fallback script (no system psql required)"
  $nodeArgs = "--host $DbHost --port $DbPort --user $DbUser --db $DbName --password $plainPassword --apiPort $ApiPort"
  if ($UpsertAdmin) { $nodeArgs += ' --upsert' }
  try {
    & node .\scripts\check-admin-user-node.js $nodeArgs
  } catch {
    Write-Host "Node fallback failed: $_" -ForegroundColor Red
  }
}

# 6) Call local API endpoint /api/users (Next dev server assumed)
Write-Host "\n--- Calling local API: /api/users (port $ApiPort) ---"
try {
  $uri = "http://localhost:$ApiPort/api/users"
  Write-Host "GET $uri"
  $res = Invoke-RestMethod -Uri $uri -Method Get -ErrorAction Stop
  # many API shapes possible; inspect and print a compact summary
  if ($res -is [System.Array]) {
    Write-Host "API returned array: count = $($res.Length)"
    $sample = $res | Select-Object -First 10
    $sample | ConvertTo-Json -Depth 5 | Write-Host
  } elseif ($res -and $res.value -is [System.Array]) {
    Write-Host "API returned { value: [...] }: count = $($res.value.Length)"
    $res.value | Select-Object -First 10 | ConvertTo-Json -Depth 5 | Write-Host
  } elseif ($res -and $res.ok -and $res.result -is [System.Array]) {
    Write-Host "API returned { ok: true, result: [...] }: count = $($res.result.Length)"
    $res.result | Select-Object -First 10 | ConvertTo-Json -Depth 5 | Write-Host
  } else {
    Write-Host "API returned non-array shape:"; ConvertTo-Json $res -Depth 5 | Write-Host
  }
} catch {
  Write-Host "API call failed: $_" -ForegroundColor Yellow
}

# 7) Optional: upsert admin using repo script (requires node + ts-node available)
if ($UpsertAdmin) {
  Write-Host "\n--- Running admin upsert (src/lib/set-admin-user.ts) ---"
  try {
    # Run via npx so it uses project's ts-node if available
    & npx ts-node src/lib/set-admin-user.ts
  } catch {
    Write-Host "Failed to run npx ts-node. Ensure node and ts-node are installed and in PATH." -ForegroundColor Red
  }
  Write-Host "After upsert, re-run the relevant queries or the script without -UpsertAdmin to inspect results."
}

Write-Host "\nDone. Paste the outputs here and I'll analyze the results."