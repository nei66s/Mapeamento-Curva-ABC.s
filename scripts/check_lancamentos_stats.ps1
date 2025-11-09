<#
Script: scripts/check_lancamentos_stats.ps1
Propósito: conectar ao Postgres via psql e coletar estatísticas básicas da tabela public.lancamentos_mensais.
Uso:
  .\check_lancamentos_stats.ps1 -Host localhost -User postgres -Db mydb -Password secret

Parâmetros:
  -Host (string)   : host do Postgres
  -User (string)   : usuário
  -Db (string)     : database
  -Port (int)      : porta (padrão 5432)
  -Password (str)  : senha (opcional; se fornecida será exportada como PGPASSWORD para psql)

Observações:
 - Requer psql no PATH.
 - Este script apenas chama psql; não executa alterações no banco.
#>

param(
  [Parameter(Mandatory=$true)][string]$Host,
  [Parameter(Mandatory=$true)][string]$User,
  [Parameter(Mandatory=$true)][string]$Database,
  [int]$Port = 5432,
  [string]$Password = ''
)

function Ensure-PsqlAvailable {
  $psql = Get-Command psql -ErrorAction SilentlyContinue
  if (-not $psql) {
    Write-Error "psql não foi encontrado no PATH. Instale o cliente psql ou adicione ao PATH."
    exit 1
  }
}

Ensure-PsqlAvailable

if ($Password -ne '') {
  $env:PGPASSWORD = $Password
} else {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

$baseArgs = "-h $Host -p $Port -U $User -d $Database -t -A -F',' -q -c"

Write-Host ("Conectando em {0}:{1} (DB={2}) como {3}" -f ${Host}, $Port, $Db, $User) -ForegroundColor Cyan

# 1) Row count
try {
  $count = & psql $baseArgs "SELECT count(*) FROM public.lancamentos_mensais;" 2>&1
  Write-Host "count: $($count.Trim())" -ForegroundColor Green
} catch {
  Write-Host "Erro ao executar count: $_" -ForegroundColor Red
}

# 2) Min / Max data_lancamento
try {
  $minmax = & psql $baseArgs "SELECT coalesce(min(data_lancamento)::text,'NULL') AS min_date, coalesce(max(data_lancamento)::text,'NULL') AS max_date FROM public.lancamentos_mensais;" 2>&1
  Write-Host "min_max: $($minmax.Trim())" -ForegroundColor Green
} catch {
  Write-Host "Erro ao executar min/max: $_" -ForegroundColor Red
}

# 3) Sample rows (5 maiores data_lancamento)
try {
  $sample = & psql $baseArgs "SELECT id, data_lancamento, valor FROM public.lancamentos_mensais ORDER BY data_lancamento DESC LIMIT 5;" 2>&1
  Write-Host "sample_rows:`n$sample" -ForegroundColor Green
} catch {
  Write-Host "Erro ao buscar sample rows: $_" -ForegroundColor Red
}

Write-Host "\nPronto. Cole os resultados aqui para eu analisar e sugerir o próximo passo." -ForegroundColor Cyan

# Cleanup
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
