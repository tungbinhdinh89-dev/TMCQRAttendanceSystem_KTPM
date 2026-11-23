$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "project.mjs") check @args
exit $LASTEXITCODE
