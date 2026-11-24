$ErrorActionPreference = "Stop"
& node (Join-Path $PSScriptRoot "setup-local-env.mjs") @args
exit $LASTEXITCODE
