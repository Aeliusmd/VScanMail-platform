# Deploy VScanmail on the QA machine after a push to origin/dev_visal.
# Preserves .env.local files (gitignored). Does not run git clean.

param(
    [string]$Branch = "dev_visal",
    [string]$RepoPath = "E:\Visal\VScanmail",
    [switch]$SkipBuild,
    [switch]$RunMigrations
)

$ErrorActionPreference = "Stop"

# GitHub Actions runner service often runs as NETWORK SERVICE without user PATH.
$env:Path = @(
    "C:\Program Files\nodejs",
    "C:\Program Files\Git\cmd",
    "$env:APPDATA\npm",
    "$env:ProgramFiles\nodejs"
) -join ";" + ";" + $env:Path

function Write-Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

if (-not (Test-Path $RepoPath)) {
    throw "Repo path not found: $RepoPath"
}

Write-Step "Deploying branch '$Branch' in $RepoPath"
Set-Location $RepoPath

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git is not installed or not on PATH"
}

# Required when the runner service runs as NETWORK SERVICE but the repo is owned by aiuser.
$safeDir = (Resolve-Path $RepoPath).Path -replace '\\', '/'
git config --global --add safe.directory $safeDir 2>$null
git config --global --add safe.directory '*' 2>$null

function Stop-PortListeners {
    param([int[]]$Ports)
    foreach ($port in $Ports) {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            $processId = $conn.OwningProcess
            if ($processId -and $processId -ne 0) {
                Write-Host "Stopping process $processId listening on port $port"
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

Write-Step "Syncing git to origin/$Branch"
git fetch origin
git checkout $Branch
git reset --hard "origin/$Branch"

if (-not $SkipBuild) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        throw "npm is not installed or not on PATH"
    }

    Write-Step "Stopping apps on ports 3010 and 3001 (avoids EPERM on node_modules)"
    Stop-PortListeners -Ports @(3010, 3001)

    # Kill PM2 daemon so it releases file handles on native .node binaries before npm ci
    Write-Host "Killing PM2 daemon to release node_modules locks..."
    & npx --yes pm2 kill 2>&1 | Out-Null

    # Give Windows time to flush kernel handles on memory-mapped native DLLs
    Start-Sleep -Seconds 6

    # Explicitly remove node_modules before npm ci — avoids EPERM on locked .node files
    Write-Host "Clearing node_modules (root)..."
    if (Test-Path "node_modules") {
        cmd /c "rmdir /s /q node_modules"
    }

    Write-Step "Installing and building API (root)"
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed in repo root" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed in repo root" }

    Write-Step "Installing and building UI (frontend)"
    Push-Location (Join-Path $RepoPath "frontend")
    if (Test-Path "node_modules") {
        cmd /c "rmdir /s /q node_modules"
    }
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed in frontend" }
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed in frontend" }
    Pop-Location
}

if ($RunMigrations) {
    Write-Step "Running database migrations (qa_vscanmail via .env.local)"
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) { throw "npm run db:migrate failed" }
}

$ecosystem = Join-Path $RepoPath "ecosystem.config.cjs"
if (-not (Test-Path $ecosystem)) {
    throw "Missing ecosystem.config.cjs at $ecosystem"
}

function Invoke-Pm2 {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Pm2Args)
    # PM2 writes warnings to stderr; do not treat them as terminating errors.
    $prevEap = $ErrorActionPreference
    $prevNative = $null
    if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
        $prevNative = $global:PSNativeCommandUseErrorActionPreference
        $global:PSNativeCommandUseErrorActionPreference = $false
    }
    $ErrorActionPreference = "Continue"
    try {
        & npx --yes pm2 @Pm2Args 2>&1 | ForEach-Object { Write-Host $_ }
        if ($LASTEXITCODE -ne 0) {
            throw "pm2 $($Pm2Args -join ' ') failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        $ErrorActionPreference = $prevEap
        if ($null -ne $prevNative) {
            $global:PSNativeCommandUseErrorActionPreference = $prevNative
        }
    }
}

function Test-Pm2AppRunning([string]$AppName) {
    $prevEap = $ErrorActionPreference
    $prevNative = $null
    if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue) {
        $prevNative = $global:PSNativeCommandUseErrorActionPreference
        $global:PSNativeCommandUseErrorActionPreference = $false
    }
    $ErrorActionPreference = "Continue"
    try {
        & npx --yes pm2 describe $AppName 2>&1 | Out-Null
        return $LASTEXITCODE -eq 0
    }
    finally {
        $ErrorActionPreference = $prevEap
        if ($null -ne $prevNative) {
            $global:PSNativeCommandUseErrorActionPreference = $prevNative
        }
    }
}

Write-Step "Reloading PM2 processes"
if (Test-Pm2AppRunning "vscanmail-api") {
    Invoke-Pm2 reload $ecosystem --update-env
} else {
    Write-Host "PM2 apps not found - starting fresh"
    Invoke-Pm2 start $ecosystem
    Invoke-Pm2 save
}

Write-Step "Deploy complete"
Invoke-Pm2 status
