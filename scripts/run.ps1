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
  $nodePath = (Get-Command node.exe -ErrorAction Stop).Source
  $frontendPort = if ($env:VITE_PORT) { [int]$env:VITE_PORT } else { 5173 }
  if (-not $Backend -and (Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue)) {
    throw "Frontend port $frontendPort is already in use. Use the existing app or stop it first."
  }
  if ($Frontend) {
    & pnpm.cmd --dir $clientPath dev --port $frontendPort --strictPort
    exit $LASTEXITCODE
  }
  Push-Location $apiPath
  try {
    $portValue = & $nodePath --import ./scripts/load-env.mjs --input-type=module -e 'console.log(process.env.PORT || 3000)'
    if ($LASTEXITCODE -ne 0) { throw "Cannot load API configuration." }
  } finally { Pop-Location }
  $apiPort = 0
  if (-not [int]::TryParse([string]$portValue, [ref]$apiPort) -or $apiPort -lt 1 -or $apiPort -gt 65535) { throw "Invalid API PORT." }
  if (Get-NetTCPConnection -LocalPort $apiPort -State Listen -ErrorAction SilentlyContinue) {
    throw "API port $apiPort is already in use. Use the existing backend or stop it first."
  }
  & pnpm.cmd --dir $apiPath build
  if ($LASTEXITCODE -ne 0) { throw "API build failed." }
  if ($Backend) {
    Push-Location $apiPath
    try { & $nodePath scripts/start.mjs; if ($LASTEXITCODE -ne 0) { throw "API exited with an error." } }
    finally { Pop-Location }
  } else {
    $logs = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "../logs"))
    New-Item -ItemType Directory -Path $logs -Force | Out-Null
    $stdout = Join-Path $logs "api-run-$apiPort.log"
    $stderr = Join-Path $logs "api-run-$apiPort-error.log"
    $entry = Join-Path $apiPath "scripts/start.mjs"
    $apiProcess = Start-Process -FilePath $nodePath -ArgumentList ('"' + $entry + '"') -WorkingDirectory $apiPath -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
    $ready = $false
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    while ([DateTime]::UtcNow -lt $deadline) {
      $apiProcess.Refresh()
      if ($apiProcess.HasExited) { throw "API startup failed (exit $($apiProcess.ExitCode)). Frontend was not started. See $stderr and $stdout" }
      $probe = New-Object System.Net.Sockets.TcpClient
      try { $probe.Connect("127.0.0.1", $apiPort); $ready = $true; break }
      catch { Start-Sleep -Milliseconds 200 }
      finally { $probe.Dispose() }
    }
    if (-not $ready) { throw "API was not ready after30 seconds. Frontend was not started. See $stderr and $stdout" }
    Write-Host "API ready on port $apiPort. Startup logs: $stdout"
    & pnpm.cmd --dir $clientPath dev --port $frontendPort --strictPort
    if ($LASTEXITCODE -ne 0) { throw "Frontend exited with an error." }
  }
} finally {
  if ($apiProcess) { $apiProcess.Refresh(); if (!$apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id } }
  $env:TMC_DATABASE_OVERRIDE = $previousOverride
}
