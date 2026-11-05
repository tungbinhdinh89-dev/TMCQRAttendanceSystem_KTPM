[CmdletBinding()]
param(
  [string]$DatabaseName = "tmc"
)

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\api\env-variable.txt"
$line = Get-Content $envFile -Raw
$hostValue = [regex]::Match($line, 'host:\s*([^:]+)').Groups[1].Value.Trim()
$portValue = [regex]::Match($line, 'port\s+(\d+)').Groups[1].Value.Trim()
$userValue = [regex]::Match($line, 'username:\s*([^,\s]+)').Groups[1].Value.Trim()
$passwordValue = [regex]::Match($line, 'pass:\s*(\S+)').Groups[1].Value.Trim()

if ([string]::IsNullOrWhiteSpace($hostValue) -or [string]::IsNullOrWhiteSpace($portValue) -or [string]::IsNullOrWhiteSpace($userValue) -or [string]::IsNullOrWhiteSpace($passwordValue)) {
  throw "api/env-variable.txt must contain host, port, username, and pass."
}

$env:DATABASE_URL = "postgresql://$([uri]::EscapeDataString($userValue)):$([uri]::EscapeDataString($passwordValue))@${hostValue}:${portValue}/${DatabaseName}"
$env:DATABASE_NAME = $DatabaseName

Write-Host "Building API..."
pnpm --dir (Join-Path $PSScriptRoot "..\api") build
if ($LASTEXITCODE -ne 0) {
  throw "API build failed."
}

$apiPath = (Resolve-Path (Join-Path $PSScriptRoot "..\api")).Path
$apiProcess = Start-Process -FilePath "node.exe" -ArgumentList "dist/main.js" -WorkingDirectory $apiPath -WindowStyle Hidden -PassThru

try {
  Write-Host "API: http://localhost:3000/api/demo/bootstrap"
  Write-Host "Client: Vite dev server"
  pnpm --dir (Join-Path $PSScriptRoot "..\client") dev
} finally {
  if ($apiProcess -and !$apiProcess.HasExited) {
    Stop-Process -Id $apiProcess.Id
  }
}
