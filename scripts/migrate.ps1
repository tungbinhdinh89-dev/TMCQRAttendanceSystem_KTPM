[CmdletBinding()]
param([string]$DatabaseName, [switch]$Show)
$ErrorActionPreference = "Stop"
$previousOverride = $env:TMC_DATABASE_OVERRIDE
try {
  if ($DatabaseName) { $env:TMC_DATABASE_OVERRIDE = $DatabaseName }
  $apiPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../api"))
  & pnpm.cmd --dir $apiPath build
  if ($LASTEXITCODE -ne 0) { throw "API build failed." }
  $operation = if ($Show) { "migration:show" } else { "migration:run" }
  & pnpm.cmd --dir $apiPath exec node --import ./scripts/load-env.mjs ./node_modules/typeorm/cli.js $operation -d dist/platform/infrastructure/database/data-source.js
  if ($LASTEXITCODE -ne 0) { throw "TypeORM migration command failed." }
} finally { $env:TMC_DATABASE_OVERRIDE = $previousOverride }
