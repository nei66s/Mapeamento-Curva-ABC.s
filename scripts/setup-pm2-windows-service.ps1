<#
Setup script para Windows: instala `pm2-windows-service`, cria o serviço e salva processos PM2.
Execute este script como Administrador.
#>

# Checa se está em modo Administrador
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
if (-not $IsAdmin) {
    Write-Host "Este script precisa ser executado como Administrador. Abra o PowerShell como Administrator e rode novamente." -ForegroundColor Red
    exit 1
}

Write-Host "Instalando pm2-windows-service globalmente (npm i -g pm2-windows-service)..." -ForegroundColor Cyan
npm i -g pm2-windows-service

if ($LASTEXITCODE -ne 0) {
    Write-Host "Falha ao instalar pm2-windows-service. Verifique sua instalação do Node/npm e tente novamente." -ForegroundColor Red
    exit 1
}

# Muda para a raiz do repositório (assume que este script está em ./scripts)
try {
    $repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    Set-Location -Path $repoRoot
    Write-Host "Mudando para o diretório do repo: $repoRoot" -ForegroundColor Gray
} catch {
    Write-Host "Não foi possível mudar para o diretório do repo ($PSScriptRoot/..). Continue executando no diretório atual." -ForegroundColor Yellow
}

Write-Host "Registrando serviço do PM2 (pm2-service-install)..." -ForegroundColor Cyan
# Verifica se o comando existe
if (Get-Command pm2-service-install -ErrorAction SilentlyContinue) {
    $pmExec = 'pm2-service-install -n PM2'
    Write-Host "Executando: $pmExec" -ForegroundColor Gray
    Invoke-Expression $pmExec
    if ($LASTEXITCODE -ne 0) {
        Write-Host "pm2-service-install retornou erro. Verifique a saída acima." -ForegroundColor Red
        # Não abortamos aqui; podemos ainda tentar iniciar o app via PM2 no usuário atual
    }
} else {
    Write-Host "Aviso: 'pm2-service-install' não foi encontrado. Você pode já ter o pacote instalado, ou a instalação falhou." -ForegroundColor Yellow
    Write-Host "Tente executar 'pm2-service-install -n PM2' manualmente como Administrador se desejar criar o serviço." -ForegroundColor Yellow
}

Write-Host "Iniciando aplicação via PM2 (ecosystem.config.js)..." -ForegroundColor Cyan
if (Test-Path "ecosystem.config.js") {
    pm2 start "ecosystem.config.js"
} else {
    Write-Host "Arquivo 'ecosystem.config.js' não encontrado na raiz do repo. Verifique que você está no diretório correto ($repoRoot)." -ForegroundColor Yellow
}

Write-Host "Salvando estado atual do PM2 (pm2 save)..." -ForegroundColor Cyan
pm2 save

Write-Host "Feito: tentativa finalizada. Verifique com: pm2 status e pm2 logs <nome>" -ForegroundColor Green

# Fim do script
