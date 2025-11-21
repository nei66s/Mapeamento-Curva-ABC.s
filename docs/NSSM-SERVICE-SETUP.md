# NSSM PM2 Service - Setup Guide

## Problem Solved
After reboot, PM2 processes were not resurrecting due to permission issues with `pm2-windows-service` (service running as SYSTEM, user running as regular account → EPERM on IPC pipe).

## Solution: NSSM + PM2 Running Under User Account

NSSM (Non-Sucking Service Manager) creates a Windows service that runs PM2 under **your user account**, ensuring proper permissions.

---

## Quick Setup (Run as Administrator)

### Step 1: Open PowerShell ISE as Administrator
Right-click PowerShell ISE → "Run as Administrator"

### Step 2: Run the Setup Script
```powershell
cd C:\Users\neiol\OneDrive\Desktop\Mapeamento-Curva-ABC
.\scripts\setup-nssm-pm2-service.ps1
```

**What it does:**
1. Checks for admin privileges
2. Installs Chocolatey (if needed)
3. Installs NSSM (if needed)
4. Creates a batch script that runs `pm2 resurrect`
5. Creates Windows service `PM2-CurvaABC` using NSSM
6. Configures service to run under your account (will prompt for Windows password)
7. Sets service to auto-start with delayed start
8. Starts the service and verifies PM2 processes

### Step 3: Enter Your Password
When prompted, enter your **Windows login password**. This allows the service to run under your account with proper permissions.

### Step 4: Verify
After the script completes:
```powershell
# Check service status
Get-Service PM2-CurvaABC

# Check PM2 processes
pm2 status

# Check app logs
pm2 logs curva-abc --lines 50
```

### Step 5: Test Reboot
```powershell
# Reboot your machine
Restart-Computer

# After reboot, verify:
pm2 status
pm2 logs curva-abc --lines 50
```

---

## Manual Commands (if needed)

### Check Service Status
```powershell
Get-Service PM2-CurvaABC
```

### Start/Stop Service
```powershell
Start-Service PM2-CurvaABC
Stop-Service PM2-CurvaABC
Restart-Service PM2-CurvaABC
```

### View Service Logs
```powershell
Get-Content logs\nssm\pm2-service.log -Tail 50 -Wait
```

### Edit Service Configuration
```powershell
nssm edit PM2-CurvaABC
```

### Remove Service (if needed)
```powershell
nssm stop PM2-CurvaABC
nssm remove PM2-CurvaABC confirm
```

---

## How It Works

1. **NSSM Service** (`PM2-CurvaABC`):
   - Runs at Windows startup (delayed auto-start)
   - Executes `scripts\pm2-resurrect.bat` under your user account
   
2. **Resurrect Batch Script**:
   - Changes to repo directory
   - Runs `pm2 resurrect` to restore saved processes from `~\.pm2\dump.pm2`
   - Tails logs (keeps process alive)

3. **PM2 Dump File** (`C:\Users\neiol\.pm2\dump.pm2`):
   - Contains saved process configuration
   - Updated automatically when you run `pm2 save`

---

## Troubleshooting

### Service won't start
```powershell
# Check NSSM logs
Get-Content logs\nssm\pm2-service-error.log

# Verify batch script exists
Test-Path scripts\pm2-resurrect.bat

# Verify PM2 is installed globally
pm2 --version
```

### PM2 shows "No process found"
```powershell
# Manually start your app and save
pm2 start ecosystem.config.js
pm2 save --force

# Restart service
Restart-Service PM2-CurvaABC
```

### Permission errors
- Ensure you entered correct Windows password during setup
- Verify service is running under your account:
  ```powershell
  Get-WmiObject win32_service | Where-Object {$_.Name -eq 'PM2-CurvaABC'} | Select Name, StartName, State
  ```

### After OneDrive sync issues
If your profile is in OneDrive and it causes delays:
```powershell
# Option 1: Move PM2 home outside OneDrive
$env:PM2_HOME = "C:\PM2"
pm2 save --force

# Option 2: Delay service start more
nssm set PM2-CurvaABC Start SERVICE_DELAYED_AUTO_START
```

---

## Advantages over pm2-windows-service

✅ Runs under your user account (no permission issues)  
✅ Actively maintained (NSSM is stable and widely used)  
✅ Better error recovery and logging  
✅ GUI configuration available (`nssm edit`)  
✅ Works with OneDrive profile paths  

---

## Related Files

- `scripts/setup-nssm-pm2-service.ps1` - Automated setup script
- `scripts/pm2-resurrect.bat` - Batch script executed by NSSM service
- `ecosystem.config.js` - PM2 app configuration
- `logs/nssm/` - Service logs directory

---

## Next Steps After Reboot Test

If everything works after reboot:
1. ✅ Your app auto-starts on Windows boot
2. ✅ Access at http://localhost:9002
3. ✅ Managed via `pm2` commands as usual

Optional improvements:
- Set up reverse proxy (IIS, Caddy, nginx) for production domain
- Configure Windows Firewall rules if exposing externally
- Set up log rotation for PM2 logs (`pm2 install pm2-logrotate`)
