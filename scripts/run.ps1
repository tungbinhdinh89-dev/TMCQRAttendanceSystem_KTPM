[CmdletBinding()]
param(
  [Alias("--frontend")][switch]$Frontend,
  [Alias("--backend")][switch]$Backend,
  [Alias("--all")][switch]$All,
  [Alias("database-name", "--database-name")][string]$DatabaseName
)
$ErrorActionPreference = "Stop"
if ($Frontend -and $Backend) { throw "Choose either Frontend or Backend." }
if ($All -and ($Frontend -or $Backend)) { throw "All cannot be combined with Frontend or Backend." }
$previousOverride = $env:TMC_DATABASE_OVERRIDE
$apiProcess = $null
try {
  if ($DatabaseName) { $env:TMC_DATABASE_OVERRIDE = $DatabaseName }
  $apiPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../api"))
  $clientPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../client"))
  if ($Frontend) {
    & pnpm.cmd --dir $clientPath dev
    exit $LASTEXITCODE
  }
  if (Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue) {
    throw "Port 3000 is already in use. Stop the existing API before starting another backend."
  }
  & pnpm.cmd --dir $apiPath build
  if ($LASTEXITCODE -ne 0) { throw "API build failed." }
  if ($Backend) {
    Push-Location $apiPath
    try { & node.exe scripts/start.mjs; if ($LASTEXITCODE -ne 0) { throw "API exited with an error." } }
    finally { Pop-Location }
  } else {
    $entry = Join-Path $apiPath "scripts/start.mjs"
    $apiProcess = Start-Process -FilePath "node.exe" -ArgumentList ('"' + $entry + '"') -WorkingDirectory $apiPath -WindowStyle Hidden -PassThru
    & pnpm.cmd --dir $clientPath dev
    if ($LASTEXITCODE -ne 0) { throw "Frontend exited with an error." }
  }
} finally {
  if ($apiProcess -and !$apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id }
  $env:TMC_DATABASE_OVERRIDE = $previousOverride
}
