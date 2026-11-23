$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "project.mjs") update @args
exit $LASTEXITCODE
