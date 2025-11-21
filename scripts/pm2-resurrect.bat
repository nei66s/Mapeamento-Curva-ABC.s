@echo off
REM PM2 Resurrect Batch Script
REM Fix PM2_HOME and PATH so PM2 is found when run as a service
set PM2_HOME=%USERPROFILE%\.pm2
set "PM2_BIN=%USERPROFILE%\AppData\Roaming\npm\pm2.cmd"
set "PATH=%USERPROFILE%\AppData\Roaming\npm;C:\Program Files\nodejs;%PATH%"

cd /d "C:\Users\neiol\OneDrive\Desktop\Mapeamento-Curva-ABC"

if exist "%PM2_BIN%" (
    "%PM2_BIN%" resurrect
    "%PM2_BIN%" logs --lines 0
    goto :eof
)

REM Fallback to PATH lookup if pm2.cmd is not found at the expected location
pm2 resurrect
pm2 logs --lines 0
