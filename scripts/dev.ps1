[CmdletBinding()]
param(
  [string]$DatabaseName = "tmc"
)

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\api\env-variable.txt"
if (-not (Test-Path -LiteralPath $envFile)) {
  throw "Missing API database configuration: $envFile"
}

$line = Get-Content -LiteralPath $envFile -Raw
$hostValue = [regex]::Match($line, 'host:\s*([^:\s]+)').Groups[1].Value.Trim()
$portValue = [regex]::Match($line, 'port\s+(\d+)').Groups[1].Value.Trim()
$userValue = [regex]::Match($line, 'username:\s*([^,\s]+)').Groups[1].Value.Trim()
$passwordValue = [regex]::Match($line, 'pass:\s*(\S+)').Groups[1].Value.Trim()

if ([string]::IsNullOrWhiteSpace($hostValue) -or
    [string]::IsNullOrWhiteSpace($portValue) -or
    [string]::IsNullOrWhiteSpace($userValue) -or
    [string]::IsNullOrWhiteSpace($passwordValue)) {
  throw "api/env-variable.txt must contain host, port, username, and pass."
}

$encodedUser = [uri]::EscapeDataString($userValue)
$encodedPassword = [uri]::EscapeDataString($passwordValue)
$env:DATABASE_URL = "postgresql://${encodedUser}:${encodedPassword}@${hostValue}:${portValue}/${DatabaseName}"
$env:DATABASE_NAME = $DatabaseName

Write-Host "Building API..."
& pnpm.cmd --dir (Join-Path $PSScriptRoot "..\api") build
if ($LASTEXITCODE -ne 0) {
  throw "API build failed."
}

$apiPath = (Resolve-Path (Join-Path $PSScriptRoot "..\api")).Path
$apiProcess = Start-Process -FilePath "node.exe" -ArgumentList (Join-Path $apiPath "dist\main.js") -WorkingDirectory $apiPath -PassThru

try {
  Write-Host "API: http://localhost:3000/api"
  Write-Host "Client: Vite dev server"
  & pnpm.cmd --dir (Join-Path $PSScriptRoot "..\client") dev
  exit $LASTEXITCODE
}
finally {
  if ($apiProcess -and !$apiProcess.HasExited) {
    Stop-Process -Id $apiProcess.Id
  }
}
