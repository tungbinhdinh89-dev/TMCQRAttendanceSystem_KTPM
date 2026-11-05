[CmdletBinding()]
param([string]$DatabaseName = '')
& (Join-Path $PSScriptRoot 'db.ps1') -Action migrate -DatabaseName $DatabaseName
