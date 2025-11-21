# Using NSSM to run PM2 on Windows (recommended alternative)

If `pm2-windows-service` is unreliable or deprecated on your environment, `nssm` is a small, robust helper to create Windows Services that run arbitrary commands. Below are step-by-step instructions to create a service that will run `pm2 resurrect` at boot and keep PM2 alive.

1) Download NSSM

- Official site: https://nssm.cc/download
- Unzip and place `nssm.exe` in a folder (example: `C:\tools\nssm\nssm.exe`).

2) Install the service (run PowerShell as Administrator)

Replace paths where appropriate. Example commands:

```powershell
# directory where nssm.exe is located
$nssm = 'C:\tools\nssm\nssm.exe'

# Install a service named 'PM2' that invokes the global pm2 CLI to resurrect processes
& $nssm install PM2 "C:\Users\neiol\AppData\Roaming\npm\pm2.cmd" "resurrect"

# Set the working directory (optional)
& $nssm set PM2 AppDirectory "C:\Users\neiol"

# (Optional) set the service to run under a specific user if needed
# & $nssm set PM2 ObjectName "DOMAIN\username" "password"

# Start the service
& $nssm start PM2
```

3) Ensure PM2 dump is saved

Before reboot, ensure the PM2 dump contains your processes:

```powershell
pm2 start ecosystem.config.js
pm2 save
```

4) Verify after reboot

- Reboot the machine. The NSSM service should run `pm2 resurrect` at start and restore processes from the dump.
- Check with:

```powershell
Get-Service PM2
pm2 status
pm2 logs curva-abc --lines 200
```

Notes
- `nssm` is stable and works well on Windows Server. It simply wraps arbitrary executables into services.
- If your PM2 is installed globally with npm, the path to `pm2.cmd` is usually `C:\Users\<you>\AppData\Roaming\npm\pm2.cmd`.
- If you prefer the service to run `pm2 start ecosystem.config.js` instead of `resurrect`, set the arguments accordingly.
