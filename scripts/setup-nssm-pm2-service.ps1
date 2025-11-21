# Setup NSSM PM2 Service for Windows
# Run this script as Administrator in PowerShell ISE
# This creates a Windows service that runs PM2 under your user account

# 0) Check admin privileges
If (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Please run this script as Administrator (right-click PowerShell ISE -> Run as Administrator)."
    exit 1
}

# 1) Configuration
$ServiceName = "PM2-CurvaABC"
$RepoRoot = "C:\Users\neiol\OneDrive\Desktop\Mapeamento-Curva-ABC"
$NssmPath = "C:\ProgramData\chocolatey\bin\nssm.exe"
$PM2Path = (Get-Command pm2 -ErrorAction SilentlyContinue).Source

if (-not $PM2Path) {
    Write-Error "PM2 not found in PATH. Please ensure PM2 is globally installed: npm install -g pm2"
    exit 2
}

Write-Host "PM2 found at: $PM2Path" -ForegroundColor Green

# 2) Check if NSSM is installed
if (-not (Test-Path $NssmPath)) {
    Write-Host "NSSM not found. Installing via Chocolatey..." -ForegroundColor Yellow
    
    # Check if chocolatey is installed
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Installing Chocolatey package manager..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    }
    
    # Install NSSM
    choco install nssm -y
    
    # Refresh path again
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    # Verify installation
    if (-not (Test-Path $NssmPath)) {
        Write-Error "NSSM installation failed. Please install manually from https://nssm.cc/download"
        exit 3
    }
}

Write-Host "NSSM found at: $NssmPath" -ForegroundColor Green

# 3) Stop and remove existing service if it exists
$ExistingService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($ExistingService) {
    Write-Host "Removing existing service '$ServiceName'..." -ForegroundColor Yellow
    & $NssmPath stop $ServiceName
    & $NssmPath remove $ServiceName confirm
    Start-Sleep -Seconds 2
}

# 4) Ensure PM2 has saved processes
Write-Host "Saving current PM2 process list..." -ForegroundColor Cyan
Set-Location $RepoRoot
pm2 save --force

# 5) Create batch script that PM2 will execute
$BatchScriptPath = Join-Path $RepoRoot "scripts\pm2-resurrect.bat"
$BatchContent = @"
@echo off
REM PM2 Resurrect Batch Script
REM Fix PM2_HOME to prevent it from looking in wrong location
set PM2_HOME=%USERPROFILE%\.pm2
cd /d "$RepoRoot"
pm2 resurrect
pm2 logs --lines 0
"@

$BatchContent | Out-File -FilePath $BatchScriptPath -Encoding ASCII -Force
Write-Host "Created resurrect script at: $BatchScriptPath" -ForegroundColor Green

# 6) Create the NSSM service
Write-Host "Creating NSSM service '$ServiceName'..." -ForegroundColor Cyan

& $NssmPath install $ServiceName $BatchScriptPath

# 7) Configure service parameters
Write-Host "Configuring service parameters..." -ForegroundColor Cyan

# Set working directory
& $NssmPath set $ServiceName AppDirectory $RepoRoot

# Set startup type to automatic with delayed start
& $NssmPath set $ServiceName Start SERVICE_DELAYED_AUTO_START

# Set service to run under current user account
$CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
Write-Host "Setting service to run as: $CurrentUser" -ForegroundColor Yellow
Write-Host "You will be prompted to enter your Windows password..." -ForegroundColor Yellow

# Prompt for password
$Credential = Get-Credential -UserName $CurrentUser -Message "Enter your Windows password to run PM2 service under your account"
$Username = $Credential.UserName
$Password = $Credential.GetNetworkCredential().Password

& $NssmPath set $ServiceName ObjectName $Username $Password

# Configure service recovery on failure
& $NssmPath set $ServiceName AppExit Default Restart
& $NssmPath set $ServiceName AppRestartDelay 5000

# Configure stdout/stderr logging
$LogDir = Join-Path $RepoRoot "logs\nssm"
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

& $NssmPath set $ServiceName AppStdout "$LogDir\pm2-service.log"
& $NssmPath set $ServiceName AppStderr "$LogDir\pm2-service-error.log"
& $NssmPath set $ServiceName AppRotateFiles 1
& $NssmPath set $ServiceName AppRotateBytes 1048576  # 1MB

Write-Host "Service configured successfully!" -ForegroundColor Green

# 8) Start the service
Write-Host "Starting service '$ServiceName'..." -ForegroundColor Cyan
& $NssmPath start $ServiceName

Start-Sleep -Seconds 5

# 9) Verify service status
$Service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($Service -and $Service.Status -eq 'Running') {
    Write-Host "`n=== SUCCESS ===" -ForegroundColor Green
    Write-Host "Service '$ServiceName' is running!" -ForegroundColor Green
    Write-Host "`nService Details:" -ForegroundColor Cyan
    $Service | Format-List Name, Status, StartType, DisplayName
    
    Write-Host "`nWaiting for PM2 to resurrect processes..." -ForegroundColor Cyan
    Start-Sleep -Seconds 5
    
    Write-Host "`nPM2 Process Status:" -ForegroundColor Cyan
    pm2 status
    
    Write-Host "`n=== NEXT STEPS ===" -ForegroundColor Yellow
    Write-Host "1. Verify the app is running: http://localhost:9002" -ForegroundColor White
    Write-Host "2. Check PM2 status anytime: pm2 status" -ForegroundColor White
    Write-Host "3. View service logs: Get-Content '$LogDir\pm2-service.log' -Tail 50" -ForegroundColor White
    Write-Host "4. REBOOT your machine to test auto-start" -ForegroundColor White
    Write-Host "`nAfter reboot, run: pm2 status" -ForegroundColor Cyan
    
} else {
    Write-Error "Service failed to start. Check logs at: $LogDir"
    Write-Host "To view NSSM service configuration, run: $NssmPath edit $ServiceName" -ForegroundColor Yellow
    exit 4
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Green
