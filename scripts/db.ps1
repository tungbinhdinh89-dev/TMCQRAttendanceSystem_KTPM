[CmdletBinding()]
param(
  [ValidateSet('ensure', 'status', 'migrate', 'seed', 'setup')][string]$Action = 'status',
  [string]$DatabaseName = ''
)
. (Join-Path $PSScriptRoot 'common.ps1')
$previousDatabaseName = $env:DATABASE_NAME
$previousAction = $env:DB_ACTION
try {
  if ($DatabaseName) { $env:DATABASE_NAME = $DatabaseName }
  if ($Action -in @('seed', 'setup')) {
    Invoke-TmcApiNode -Arguments @('scripts/check-account-env.mjs')
  }
  if ($Action -eq 'status') {
    $env:DB_ACTION = 'status'
    Invoke-TmcApiNode -Arguments @('scripts/db-check.mjs')
    return
  }
  $env:DB_ACTION = 'ensure'
  Invoke-TmcApiNode -Arguments @('scripts/db-check.mjs')
  if ($Action -eq 'ensure') { return }
  Invoke-TmcPnpm -Arguments @('--dir', $script:TmcApi, 'build')
  if ($Action -in @('migrate', 'setup')) {
    Invoke-TmcApiNode -Arguments @('./node_modules/typeorm/cli.js', 'migration:run', '-d', 'dist/platform/infrastructure/database/data-source.js')
  }
  if ($Action -in @('seed', 'setup')) {
    Invoke-TmcApiNode -Arguments @('scripts/seed-accounts.mjs', '--apply')
  }
  $env:DB_ACTION = 'status'
  Invoke-TmcApiNode -Arguments @('scripts/db-check.mjs')
} finally {
  $env:DATABASE_NAME = $previousDatabaseName
  $env:DB_ACTION = $previousAction
}
