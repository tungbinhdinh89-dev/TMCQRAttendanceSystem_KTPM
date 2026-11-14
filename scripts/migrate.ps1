[CmdletBinding()]
param(
  [string]$DatabaseName = "tmc"
)

$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "run.ps1") -DatabaseName $DatabaseName
if ($LASTEXITCODE -ne 0) {
  throw "Database bootstrap failed."
}

Write-Host "Building API for TypeORM migrations..."
pnpm.cmd --filter @tmc/api build
if ($LASTEXITCODE -ne 0) {
  throw "API build failed."
}

$env:DB_ACTION = "status"
Write-Host "Running pending TypeORM migrations..."
pnpm.cmd --filter @tmc/api exec typeorm migration:run -d dist/platform/infrastructure/database/data-source.js
if ($LASTEXITCODE -ne 0) {
  throw "TypeORM migration failed."
}
