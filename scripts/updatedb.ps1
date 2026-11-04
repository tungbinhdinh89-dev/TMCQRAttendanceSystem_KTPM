[CmdletBinding()]
param(
  [string]$DatabaseName = "tmc"
)

$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "migrate.ps1") -DatabaseName $DatabaseName
if ($LASTEXITCODE -ne 0) {
  throw "Migration step failed."
}

$env:DB_ACTION = "status"
Write-Host "Verifying database metadata..."
$envFile = Join-Path $PSScriptRoot "..\env-variable.txt"
$line = Get-Content $envFile -Raw
$hostValue = [regex]::Match($line, 'host:\s*([^:]+)').Groups[1].Value.Trim()
$portValue = [regex]::Match($line, 'port\s+(\d+)').Groups[1].Value.Trim()
$userValue = [regex]::Match($line, 'username:\s*([^,\s]+)').Groups[1].Value.Trim()
$passwordValue = [regex]::Match($line, 'pass:\s*(\S+)').Groups[1].Value.Trim()
$env:DATABASE_URL = "postgresql://$([uri]::EscapeDataString($userValue)):$([uri]::EscapeDataString($passwordValue))@${hostValue}:${portValue}/${DatabaseName}"
$env:DATABASE_NAME = $DatabaseName

pnpm --filter @tmc/api exec node (Join-Path $PSScriptRoot "..\api\scripts\db-check.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Database verification failed."
}
