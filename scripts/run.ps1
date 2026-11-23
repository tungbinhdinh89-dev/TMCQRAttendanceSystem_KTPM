$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "project.mjs") run @args
exit $LASTEXITCODE
