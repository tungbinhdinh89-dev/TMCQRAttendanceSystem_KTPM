[CmdletBinding()]
param([string]$DatabaseName, [switch]$Seed)
$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "migrate.ps1") -DatabaseName $DatabaseName
& (Join-Path $PSScriptRoot "check.ps1") -DatabaseName $DatabaseName
# Demo seed changes business data and is always explicit.
if ($Seed) {
  $previousOverride = $env:TMC_DATABASE_OVERRIDE
  try {
    if ($DatabaseName) { $env:TMC_DATABASE_OVERRIDE = $DatabaseName }
    & pnpm.cmd --dir (Join-Path $PSScriptRoot "../api") seed:demo
    if ($LASTEXITCODE -ne 0) { throw "Demo seed failed. Configure DEMO_PASSWORD and DEMO_STATION_SECRET." }
  } finally { $env:TMC_DATABASE_OVERRIDE = $previousOverride }
}
