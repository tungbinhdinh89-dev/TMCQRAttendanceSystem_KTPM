$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "seed-data.mjs") @args
exit $LASTEXITCODE
