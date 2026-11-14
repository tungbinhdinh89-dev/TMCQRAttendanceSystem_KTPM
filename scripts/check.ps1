[CmdletBinding()]
param([string]$DatabaseName = '')
& (Join-Path $PSScriptRoot 'db.ps1') -Action status -DatabaseName $DatabaseName
