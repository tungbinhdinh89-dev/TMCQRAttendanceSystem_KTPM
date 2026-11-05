[CmdletBinding()]
param(
  [ValidateSet('all', 'fe', 'be')][string]$Target = 'all',
  [string]$DatabaseName = '',
  [ValidateRange(1, 65535)][int]$ApiPort = 3000,
  [ValidateRange(1, 65535)][int]$ClientPort = 5173,
  [switch]$Watch
)
. (Join-Path $PSScriptRoot 'common.ps1')
$previousPort = $env:PORT
$previousDatabaseName = $env:DATABASE_NAME
$previousApiUrl = $env:VITE_API_URL
$apiProcess = $null
try {
  if ($DatabaseName) { $env:DATABASE_NAME = $DatabaseName }
  if ($Target -eq 'fe') {
    Assert-TmcPortAvailable -Port $ClientPort
    $env:PORT = [string]$ClientPort
    Invoke-TmcPnpm -Arguments @('--dir', (Join-Path $script:TmcRoot 'client'), 'dev', '--port', [string]$ClientPort)
    return
  }
  Assert-TmcPortAvailable -Port $ApiPort
  $env:PORT = [string]$ApiPort
  if ($Target -eq 'be') {
    if ($Watch) {
      Invoke-TmcPnpm -Arguments @('--dir', $script:TmcApi, 'start:dev')
    } else {
      Invoke-TmcPnpm -Arguments @('--dir', $script:TmcApi, 'build')
      Invoke-TmcPnpm -Arguments @('--dir', $script:TmcApi, 'start')
    }
    return
  }
  if ($ApiPort -eq $ClientPort) { throw 'API and client must use different ports.' }
  Assert-TmcPortAvailable -Port $ClientPort
  if (-not $Watch) { Invoke-TmcPnpm -Arguments @('--dir', $script:TmcApi, 'build') }
  $logDirectory = Join-Path $script:TmcApi 'logs'
  New-Item -ItemType Directory -Force -Path $logDirectory | Out-Null
  $runId = [guid]::NewGuid().ToString('N')
  $stdout = Join-Path $logDirectory "api-$runId.out.log"
  $stderr = Join-Path $logDirectory "api-$runId.err.log"
  $nodeArguments = if ($Watch) {
    @('--import', './scripts/load-env.mjs', './node_modules/@nestjs/cli/bin/nest.js', 'start', '--watch')
  } else { @('scripts/start.mjs') }
  $apiProcess = Start-Process -FilePath (Get-Command node.exe).Source -ArgumentList $nodeArguments -WorkingDirectory $script:TmcApi -WindowStyle Hidden -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru
  Write-Host "Waiting for API. Logs: $logDirectory"
  Wait-TmcApi -Process $apiProcess -Port $ApiPort
  Write-Host "API: http://localhost:$ApiPort/api/me (401 before login is expected)"
  Write-Host "Client: http://localhost:$ClientPort/dang-nhap"
  Write-Host 'Press Ctrl+C to stop this launcher and its API child process.'
  $env:PORT = [string]$ClientPort
  $env:VITE_API_URL = "http://localhost:$ApiPort/api"
  Invoke-TmcPnpm -Arguments @('--dir', (Join-Path $script:TmcRoot 'client'), 'dev', '--port', [string]$ClientPort)
} finally {
  Stop-TmcChild -Process $apiProcess
  $env:PORT = $previousPort
  $env:DATABASE_NAME = $previousDatabaseName
  $env:VITE_API_URL = $previousApiUrl
}
