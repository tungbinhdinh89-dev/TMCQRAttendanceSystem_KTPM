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
$envFile = Join-Path $PSScriptRoot "..\api\env-variable.txt"
$line = Get-Content $envFile -Raw
$hostValue = [regex]::Match($line, 'host:\s*([^:]+)').Groups[1].Value.Trim()
$portValue = [regex]::Match($line, 'port\s+(\d+)').Groups[1].Value.Trim()
$userValue = [regex]::Match($line, 'username:\s*([^,\s]+)').Groups[1].Value.Trim()
$passwordValue = [regex]::Match($line, 'pass:\s*(\S+)').Groups[1].Value.Trim()
$env:DATABASE_URL = "postgresql://$([uri]::EscapeDataString($userValue)):$([uri]::EscapeDataString($passwordValue))@${hostValue}:${portValue}/${DatabaseName}"
$env:DATABASE_NAME = $DatabaseName

pnpm.cmd --filter @tmc/api exec node (Join-Path $PSScriptRoot "..\api\scripts\db-check.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Database verification failed."
}

if ([string]::IsNullOrWhiteSpace($env:DEMO_PASSWORD) -or [string]::IsNullOrWhiteSpace($env:DEMO_STATION_SECRET)) {
  throw "Set DEMO_PASSWORD and DEMO_STATION_SECRET before running updatedb.ps1; these values are hashed and never stored in the repository."
}

Write-Host "Seeding demo identity, scope, and IN/OUT stations..."
pnpm.cmd --filter @tmc/api seed:demo
if ($LASTEXITCODE -ne 0) {
  throw "Demo seed failed."
}
