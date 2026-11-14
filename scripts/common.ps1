Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$script:TmcRoot = Split-Path -Parent $PSScriptRoot
$script:TmcApi = Join-Path $script:TmcRoot 'api'

function Invoke-TmcPnpm {
  param([string[]]$Arguments)
  Push-Location $script:TmcRoot
  try {
    & pnpm.cmd @Arguments
    if ($LASTEXITCODE -ne 0) { throw "pnpm failed (exit $LASTEXITCODE)." }
  } finally { Pop-Location }
}

function Invoke-TmcApiNode {
  param([string[]]$Arguments)
  Push-Location $script:TmcApi
  try {
    & node.exe --import ./scripts/load-env.mjs @Arguments
    if ($LASTEXITCODE -ne 0) { throw "API command failed (exit $LASTEXITCODE)." }
  } finally { Pop-Location }
}

function Assert-TmcPortAvailable {
  param([int]$Port)
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
  $listener.Server.ExclusiveAddressUse = $true
  try { $listener.Start() }
  catch { throw "Port $Port is already in use. Stop the existing server or select another port." }
  finally { $listener.Stop() }
}

function Wait-TmcApi {
  param([System.Diagnostics.Process]$Process, [int]$Port, [int]$TimeoutSeconds = 40)
  $deadline = [DateTime]::UtcNow.AddSeconds($TimeoutSeconds)
  while ([DateTime]::UtcNow -lt $deadline) {
    if ($Process.HasExited) { throw 'API exited before startup completed. Check api/logs/.' }
    try {
      $request = [System.Net.HttpWebRequest]::Create("http://localhost:$Port/api/me")
      $request.Timeout = 700
      $response = $request.GetResponse()
      $response.Close()
      return
    } catch [System.Net.WebException] {
      if ($_.Exception.Response) {
        $status = [int]$_.Exception.Response.StatusCode
        $_.Exception.Response.Close()
        if ($status -eq 401) { return }
      }
    }
    Start-Sleep -Milliseconds 200
  }
  throw 'API did not become ready within 40 seconds. Check database configuration and api/logs/.'
}

function Stop-TmcChild {
  param([System.Diagnostics.Process]$Process)
  if ($Process -and -not $Process.HasExited) {
    & "$env:SystemRoot/System32/taskkill.exe" /PID $Process.Id /T /F 2>$null | Out-Null
  }
}
