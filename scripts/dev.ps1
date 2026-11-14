[CmdletBinding()]
param(
  [ValidateSet('all', 'fe', 'be')][string]$Target = 'all',
  [string]$DatabaseName = '',
  [ValidateRange(1, 65535)][int]$ApiPort = 3000,
  [ValidateRange(1, 65535)][int]$ClientPort = 5173
)
& (Join-Path $PSScriptRoot 'run.ps1') -Target $Target -DatabaseName $DatabaseName -ApiPort $ApiPort -ClientPort $ClientPort -Watch
