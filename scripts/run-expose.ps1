# LAN HTTPS launcher for the classroom iPhone scanner.
$ErrorActionPreference = "Stop"
$arguments = @($args)
if ($arguments.Count -eq 1 -and $arguments[0] -in @("--help", "-h")) {
    Write-Host "Usage: .\scripts\run-expose.ps1 [--frontend | --backend]"
    Write-Host "Default: frontend + backend; LAN IP 192.168.1.53, HTTPS frontend 5173, HTTP backend 3000."
    Write-Host "Requires Node, installed project dependencies and OpenSSL (Git for Windows is supported)."
    Write-Host "Install/trust .local-certs/tmc-local-ca.cer on the iPhone before using its camera."
    exit 0
}
if ($arguments.Count -gt 1 -or ($arguments.Count -eq 1 -and $arguments[0] -notin @("--frontend", "--backend"))) {
    Write-Error "Use no flag, --frontend, or --backend. Use --help for instructions."
    exit 1
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$lanAddress = "192.168.1.53"
$savedEnvironment = @{}
$settings = @{
    PORT = "3000"
    VITE_PORT = "5173"
    DEV_API_TARGET = "http://127.0.0.1:3000"
    DEV_HTTPS = "1"
    DEV_HTTPS_HOST = $lanAddress
    DEV_HTTPS_CERT = (Join-Path $projectRoot ".local-certs/lan-cert.pem")
    DEV_HTTPS_KEY = (Join-Path $projectRoot ".local-certs/lan-key.pem")
}
if ($env:CORS_ORIGINS) {
    # Shell configuration overrides .env; preserve it and include the scanner origin.
    $origins = @($env:CORS_ORIGINS.Split(",") | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $origins += "https://${lanAddress}:5173"
    $settings["CORS_ORIGINS"] = ($origins | Select-Object -Unique) -join ","
}
$result = 1
try {
    # Reuse the existing CA; configure ignored local TLS files and API allowed origins.
    # The helper never installs certificate trust or changes database contents.
    & node (Join-Path $PSScriptRoot "lan-https.mjs") --ip $lanAddress
    if ($LASTEXITCODE -ne 0) { throw "LAN HTTPS setup failed; services were not started." }
    foreach ($key in $settings.Keys) {
        $savedEnvironment[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
        [Environment]::SetEnvironmentVariable($key, $settings[$key], "Process")
    }
    Write-Host "iPhone scanner: https://${lanAddress}:5173/scanner (SEC account)"
    Write-Host "Employee QR:   https://${lanAddress}:5173/qr (EMP account)"
    Write-Host "Backend API:   http://${lanAddress}:3000/api"
    Write-Host "Use the same LAN; allow Node on the Windows private-network firewall if prompted."
    Write-Host "Stop existing services on 3000/5173 before starting this launcher. Ctrl+C stops its services."
    & node (Join-Path $PSScriptRoot "project.mjs") run @arguments
    $result = $LASTEXITCODE
}
catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    $result = 1
}
finally {
    foreach ($key in $savedEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($key, $savedEnvironment[$key], "Process")
    }
}
exit $result
