<#
Simple maintenance script for PM2
Usage: run in project root (or from any dir). Does:
 - pm2 flush
 - pm2 restart curva-abc
 - pm2 save
Outputs status and logs summary afterwards.
#>

Write-Host "Running PM2 maintenance: flush -> restart curva-abc -> save" -ForegroundColor Cyan

try {
    Write-Host "Flushing logs..." -ForegroundColor Gray
    pm2 flush
} catch {
    Write-Host "Warning: pm2 flush failed: $_" -ForegroundColor Yellow
}

try {
    Write-Host "Restarting curva-abc..." -ForegroundColor Gray
    pm2 restart curva-abc
} catch {
    Write-Host "Warning: pm2 restart failed: $_" -ForegroundColor Yellow
}

try {
    Write-Host "Saving PM2 process list..." -ForegroundColor Gray
    pm2 save
} catch {
    Write-Host "Warning: pm2 save failed: $_" -ForegroundColor Yellow
}

Write-Host "Current PM2 status:" -ForegroundColor Cyan
pm2 status

Write-Host "Tailing last 100 lines of curva-abc logs (out + err):" -ForegroundColor Cyan
pm2 logs curva-abc --lines 100

Write-Host "Done." -ForegroundColor Green
