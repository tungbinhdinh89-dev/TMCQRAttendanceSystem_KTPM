[CmdletBinding()]
param(
  [string]$DatabaseName = "tmc"
)

$ErrorActionPreference = "Stop"
$envFile = Join-Path $PSScriptRoot "..\env-variable.txt"
$line = Get-Content $envFile -Raw

$hostValue = [regex]::Match($line, 'host:\s*([^:]+)').Groups[1].Value.Trim()
$portValue = [regex]::Match($line, 'port\s+(\d+)').Groups[1].Value.Trim()
$userValue = [regex]::Match($line, 'username:\s*([^,\s]+)').Groups[1].Value.Trim()
$passwordValue = [regex]::Match($line, 'pass:\s*(\S+)').Groups[1].Value.Trim()

if ([string]::IsNullOrWhiteSpace($hostValue) -or [string]::IsNullOrWhiteSpace($portValue) -or [string]::IsNullOrWhiteSpace($userValue) -or [string]::IsNullOrWhiteSpace($passwordValue)) {
  throw "env-variable.txt must contain host, port, username, and pass."
}

$encodedUser = [uri]::EscapeDataString($userValue)
$encodedPassword = [uri]::EscapeDataString($passwordValue)
$env:DATABASE_URL = "postgresql://${encodedUser}:${encodedPassword}@${hostValue}:${portValue}/${DatabaseName}"
$env:DATABASE_NAME = $DatabaseName
$env:DB_ACTION = "ensure"

Write-Host "Checking PostgreSQL at ${hostValue}:${portValue} and database '${DatabaseName}'..."
pnpm --filter @tmc/api exec node (Join-Path $PSScriptRoot "..\api\scripts\db-check.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "PostgreSQL connection or database creation failed."
}
