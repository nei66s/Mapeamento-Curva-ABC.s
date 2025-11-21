# set-nssm-localSystem.ps1
# Run this script AS ADMIN (right-click PowerShell -> Run as Administrator)
# It removes any existing PM2-CurvaABC NSSM service and recreates it as LocalSystem

If (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "This script must be run as Administrator."
    exit 1
}

$ServiceName = 'PM2-CurvaABC'
$RepoRoot = "C:\Users\neiol\OneDrive\Desktop\Mapeamento-Curva-ABC"
$Nssm = 'C:\ProgramData\chocolatey\bin\nssm.exe'
$Pm2Home = 'C:\PM2'

if (-not (Test-Path $Nssm)) {
    Write-Error "nssm.exe not found at $Nssm. Install NSSM first or adjust path."
    exit 2
}

Write-Host "Ensuring $Pm2Home exists..."
New-Item -Path $Pm2Home -ItemType Directory -Force | Out-Null

# Copy dump if present
$UserDump = Join-Path $env:USERPROFILE ".pm2\dump.pm2"
if (Test-Path $UserDump) {
    Copy-Item -Path $UserDump -Destination (Join-Path $Pm2Home 'dump.pm2') -Force
    Write-Host "Copied user dump to $Pm2Home\dump.pm2"
} else {
    Write-Warning "User dump not found at $UserDump. Proceeding regardless."
}

# Create resurrect batch script
$BatchPath = Join-Path $RepoRoot 'scripts\pm2-resurrect.bat'
$BatchContent = @"
@echo off
REM Ensure PM2_HOME for the service
set PM2_HOME=%~d0\PM2
cd /d "$RepoRoot"
REM Resurrect and keep logs
pm2 resurrect
pm2 logs --lines 0
"@

$BatchContent | Out-File -FilePath $BatchPath -Encoding ASCII -Force
Write-Host "Created/updated batch script: $BatchPath"

# Remove existing service if present
Write-Host "Removing existing service (if exists)..."
& $Nssm stop $ServiceName 2>$null
Start-Sleep -Seconds 1
& $Nssm remove $ServiceName confirm 2>$null

# Install service
Write-Host "Installing service $ServiceName -> $BatchPath"
& $Nssm install $ServiceName $BatchPath

# Configure service
Write-Host "Setting AppDirectory to $RepoRoot"
& $Nssm set $ServiceName AppDirectory $RepoRoot

Write-Host "Setting PM2_HOME to $Pm2Home for the service"
& $Nssm set $ServiceName AppEnvironmentExtra PM2_HOME=$Pm2Home

Write-Host "Setting service to run as LocalSystem"
& $Nssm set $ServiceName ObjectName LocalSystem

Write-Host "Setting delayed auto start"
& $Nssm set $ServiceName Start SERVICE_DELAYED_AUTO_START

# Start service
Write-Host "Starting service $ServiceName"
& $Nssm start $ServiceName
Start-Sleep -Seconds 5

# Show status
Get-Service -Name $ServiceName | Format-List Name,Status,StartType

# Show PM2 status from service PM2_HOME
$env:PM2_HOME = $Pm2Home
Write-Host "PM2_HOME for this session set to: $env:PM2_HOME"
Try {
    & pm2 status
} Catch {
    Write-Warning "pm2 not available in PATH for this elevated session. Install pm2 globally with 'npm install -g pm2' if needed."
}

Write-Host "If the service is running, reboot to test persistence: Restart-Computer"
Write-Host "If the service failed to start, run: nssm edit $ServiceName (as Admin) to inspect settings and logs in $RepoRoot\logs\nssm"
