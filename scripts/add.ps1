$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "project.mjs") add @args
exit $LASTEXITCODE
