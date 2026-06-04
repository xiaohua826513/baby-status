$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$logDir = Join-Path $root ".tmp"
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Force $logDir | Out-Null
}
$logFile = Join-Path $logDir "preview-window.log"

$node = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

Write-Host "Starting baby preview server..."
Write-Host "Open: http://127.0.0.1:3000/baby"
Write-Host "Keep this window open while previewing."
Write-Host ""

try {
  "root=$root" | Set-Content -Encoding utf8 $logFile
  "node=$node" | Add-Content -Encoding utf8 $logFile
  "nodeExists=$(Test-Path $node)" | Add-Content -Encoding utf8 $logFile
  & $node "scripts\local-preview-server.cjs" 2>&1 | Tee-Object -FilePath $logFile -Append
} catch {
  "error=$($_.Exception.Message)" | Add-Content -Encoding utf8 $logFile
  Write-Host $_.Exception.Message
}

Write-Host ""
Write-Host "Server stopped. Press Enter to close this window."
Read-Host
