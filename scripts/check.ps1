[CmdletBinding()]
param([string]$DatabaseName)
$ErrorActionPreference = "Stop"
$previousOverride = $env:TMC_DATABASE_OVERRIDE
$previousAction = $env:DB_ACTION
try {
  if ($DatabaseName) { $env:TMC_DATABASE_OVERRIDE = $DatabaseName }
  $env:DB_ACTION = "status"
  $apiPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../api"))
  & pnpm.cmd --dir $apiPath exec node --import ./scripts/load-env.mjs ./scripts/db-check.mjs
  if ($LASTEXITCODE -ne 0) { throw "Database status check failed." }
} finally { $env:TMC_DATABASE_OVERRIDE = $previousOverride; $env:DB_ACTION = $previousAction }
