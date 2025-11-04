param()

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$root = Resolve-Path -Path "$scriptDir\.." | Select-Object -ExpandProperty Path
$backupDir = Join-Path $root "backups"
$tempDir = Join-Path $backupDir "snapshot-$timestamp"

Write-Output "Creating snapshot at $tempDir"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

# Copy files excluding common large/build folders
$excludes = @('node_modules', '.next', 'backups', '.git')
Get-ChildItem -Path $root -Force | Where-Object { -not ($excludes -contains $_.Name) } | ForEach-Object {
    $src = $_.FullName
    $dest = Join-Path $tempDir $_.Name
    Copy-Item -Path $src -Destination $dest -Recurse -Force -ErrorAction SilentlyContinue
}

$zipPath = Join-Path $backupDir ("snapshot-$timestamp.zip")
Compress-Archive -LiteralPath $tempDir -DestinationPath $zipPath -Force

# Cleanup temp folder
Remove-Item -Recurse -Force $tempDir

Write-Output "Snapshot saved to $zipPath"
