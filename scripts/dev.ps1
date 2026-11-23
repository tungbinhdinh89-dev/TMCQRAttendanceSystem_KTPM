[CmdletBinding()]
param([string]$DatabaseName)
$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "run.ps1") -All -DatabaseName $DatabaseName
