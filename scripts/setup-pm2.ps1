# =============================================================================
# VScanMail — one-time setup to run backend (3010) + frontend (3001) nonstop
# under PM2 with auto-restart, memory guards, and boot persistence.
#
# Run from the repo root in PowerShell:
#     powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup-pm2.ps1
#
# IMPORTANT: stop any manually-running `npm run dev` / `npm run start` for ports
# 3010 and 3001 BEFORE running this (PM2 needs those ports free).
# =============================================================================

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# --- 1. Build backend (root) -------------------------------------------------
Step "Building backend (root)"
npm install
npm run build
if ($LASTEXITCODE -ne 0) { throw "Backend build failed" }

# --- 2. Build frontend -------------------------------------------------------
Step "Building frontend"
Push-Location (Join-Path $root "frontend")
npm install
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Frontend build failed" }
Pop-Location

# --- 3. (Re)start under PM2 --------------------------------------------------
Step "Starting apps under PM2"
& npx --yes pm2 delete ecosystem.config.cjs 2>$null | Out-Null  # ignore if not running
& npx --yes pm2 start ecosystem.config.cjs
if ($LASTEXITCODE -ne 0) { throw "pm2 start failed (are ports 3010/3001 free?)" }

# --- 4. Persist the process list --------------------------------------------
Step "Saving PM2 process list"
& npx --yes pm2 save

# --- 5. Boot persistence (auto-start after a server reboot) ------------------
Step "Configuring auto-start on boot"
try {
    npm install -g pm2-windows-startup
    & pm2-startup install
    & npx --yes pm2 save
    Write-Host "Boot auto-start configured via pm2-windows-startup (runs 'pm2 resurrect' at logon)." -ForegroundColor Green
} catch {
    Write-Warning "Automatic boot setup failed: $($_.Exception.Message)"
    Write-Host "Fallback: create a Scheduled Task that runs at startup:" -ForegroundColor Yellow
    Write-Host '  schtasks /Create /SC ONLOGON /TN "VScanMailPM2" /TR "cmd /c npx pm2 resurrect" /RL HIGHEST /F' -ForegroundColor Yellow
}

Step "Done"
& npx --yes pm2 status
Write-Host "`nBackend:  http://localhost:3010" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3001" -ForegroundColor Green
Write-Host "`nUseful commands:" -ForegroundColor Cyan
Write-Host "  npx pm2 status         # see running apps"
Write-Host "  npx pm2 logs           # tail logs"
Write-Host "  npx pm2 restart all    # restart after a code change + rebuild"
Write-Host "  npx pm2 monit          # live CPU/memory"
