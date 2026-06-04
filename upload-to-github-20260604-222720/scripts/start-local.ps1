param(
  [int]$Port = 3000
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "没有找到 npm。请先安装 Node.js LTS：https://nodejs.org/"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  npm install
}

if (-not (Test-Path "electron\node_modules")) {
  npm run install:electron
}

$nextArgs = "run dev -- --hostname 127.0.0.1 --port $Port"
Start-Process -FilePath "npm" -ArgumentList $nextArgs -WorkingDirectory $root

Start-Sleep -Seconds 5
Start-Process "http://127.0.0.1:$Port/baby"
Start-Process -FilePath "npm" -ArgumentList "run electron" -WorkingDirectory $root
