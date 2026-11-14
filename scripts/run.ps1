[CmdletBinding()]
param(
  [Alias("--frontend")]
  [switch]$Frontend,
  [Alias("--backend")]
  [switch]$Backend,
  [Alias("--all")]
  [switch]$All,
  [Alias("database-name", "--database-name")]
  [string]$DatabaseName = "tmc"
)

$ErrorActionPreference = "Stop"

function Get-RunArguments([string[]]$arguments) {
  $target = "all"
  $databaseName = "tmc"
  $arguments = @($arguments)

  for ($index = 0; $index -lt $arguments.Count; $index++) {
    $argument = [string]$arguments[$index]
    switch ($argument.ToLowerInvariant()) {
      "--frontend" { $target = "frontend"; continue }
      "-frontend" { $target = "frontend"; continue }
      "--backend" { $target = "backend"; continue }
      "-backend" { $target = "backend"; continue }
      "--all" { $target = "all"; continue }
      "-all" { $target = "all"; continue }
      "--database-name" {
        $index++
        if ($index -ge $arguments.Count) { throw "Missing value for --database-name." }
        $databaseName = [string]$arguments[$index]
        continue
      }
      "-databasename" {
        $index++
        if ($index -ge $arguments.Count) { throw "Missing value for -DatabaseName." }
        $databaseName = [string]$arguments[$index]
        continue
      }
      default { throw "Unknown argument '$argument'. Use --frontend, --backend, --all, or --database-name <name>." }
    }
  }

  return @{ Target = $target; DatabaseName = $databaseName }
}

function Set-DatabaseEnvironment([string]$databaseName) {
  $envFile = Join-Path $PSScriptRoot "..\api\env-variable.txt"
  if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Missing API database configuration: $envFile"
  }

  $line = Get-Content -LiteralPath $envFile -Raw
  $hostValue = [regex]::Match($line, 'host:\s*([^:\s]+)').Groups[1].Value.Trim()
  $portValue = [regex]::Match($line, 'port\s+(\d+)').Groups[1].Value.Trim()
  $userValue = [regex]::Match($line, 'username:\s*([^,\s]+)').Groups[1].Value.Trim()
  $passwordValue = [regex]::Match($line, 'pass:\s*(\S+)').Groups[1].Value.Trim()

  if ([string]::IsNullOrWhiteSpace($hostValue) -or
      [string]::IsNullOrWhiteSpace($portValue) -or
      [string]::IsNullOrWhiteSpace($userValue) -or
      [string]::IsNullOrWhiteSpace($passwordValue)) {
    throw "api/env-variable.txt must contain host, port, username, and pass."
  }

  $encodedUser = [uri]::EscapeDataString($userValue)
  $encodedPassword = [uri]::EscapeDataString($passwordValue)
  $env:DATABASE_URL = "postgresql://${encodedUser}:${encodedPassword}@${hostValue}:${portValue}/${databaseName}"
  $env:DATABASE_NAME = $databaseName
  return "${hostValue}:${portValue}/$databaseName"
}

function Test-Database([string]$databaseName) {
  $connectionTarget = Set-DatabaseEnvironment $databaseName
  Write-Host "Checking PostgreSQL at $connectionTarget..."
  & pnpm.cmd --filter @tmc/api exec node (Join-Path $PSScriptRoot "..\api\scripts\db-check.mjs")
  if ($LASTEXITCODE -ne 0) {
    throw "PostgreSQL connection or database creation failed."
  }
}

function Build-Api {
  Write-Host "Building API..."
  & pnpm.cmd --dir (Join-Path $PSScriptRoot "..\api") build
  if ($LASTEXITCODE -ne 0) {
    throw "API build failed."
  }
}

$run = Get-RunArguments $args
$target = $run.Target
$databaseName = $DatabaseName

if ($Frontend -and $Backend) {
  throw "Choose only one of --frontend or --backend."
}
if ($Frontend) {
  $target = "frontend"
}
if ($Backend) {
  $target = "backend"
}
if ($All) {
  $target = "all"
}

if ($target -ne "frontend") {
  Test-Database $databaseName
  Build-Api
}

if ($target -eq "backend") {
  $apiPath = (Resolve-Path (Join-Path $PSScriptRoot "..\api")).Path
  Write-Host "Starting API at http://localhost:3000/api"
  & node.exe (Join-Path $apiPath "dist\main.js")
  exit $LASTEXITCODE
}

if ($target -eq "frontend") {
  Write-Host "Starting frontend at http://localhost:5173"
  & pnpm.cmd --dir (Join-Path $PSScriptRoot "..\client") dev
  exit $LASTEXITCODE
}

$apiPath = (Resolve-Path (Join-Path $PSScriptRoot "..\api")).Path
$apiProcess = Start-Process -FilePath "node.exe" -ArgumentList (Join-Path $apiPath "dist\main.js") -WorkingDirectory $apiPath -PassThru

try {
  Write-Host "API: http://localhost:3000/api"
  Write-Host "Client: http://localhost:5173"
  & pnpm.cmd --dir (Join-Path $PSScriptRoot "..\client") dev
  exit $LASTEXITCODE
}
finally {
  if ($apiProcess -and !$apiProcess.HasExited) {
    Stop-Process -Id $apiProcess.Id
  }
}
