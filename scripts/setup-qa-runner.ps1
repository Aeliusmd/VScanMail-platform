# Helper to install the GitHub Actions self-hosted runner on the QA Windows machine.
# Registration token is short-lived - generate a new one from GitHub before running config.
#
# GitHub: Repo -> Settings -> Actions -> Runners -> New self-hosted runner -> Windows
#
# Usage (after downloading the runner zip to C:\actions-runner):
#   $env:RUNNER_TOKEN = "<token-from-github>"
#   .\scripts\setup-qa-runner.ps1

param(
    [string]$RunnerDir = "C:\actions-runner",
    [string]$RepoUrl = "https://github.com/Aeliusmd/VScanMail-platform",
    [string]$RunnerName = "qa-windows",
    [string]$Labels = "self-hosted,Windows,qa"
)

$ErrorActionPreference = "Stop"

Write-Host "VScanmail QA - GitHub self-hosted runner setup" -ForegroundColor Cyan
Write-Host ""
Write-Host "Repository: $RepoUrl"
Write-Host "Runner directory: $RunnerDir"
Write-Host "Labels (must match deploy-qa.yml runs-on): $Labels"
Write-Host ""

if (-not (Test-Path $RunnerDir)) {
    Write-Host "Create the runner folder and extract the GitHub runner package first:" -ForegroundColor Yellow
    Write-Host "  1. Open: $RepoUrl/settings/actions/runners/new"
    Write-Host "  2. Download the Windows x64 runner zip"
    Write-Host "  3. Extract to $RunnerDir"
    Write-Host ""
    exit 1
}

$configCmd = Join-Path $RunnerDir "config.cmd"
if (-not (Test-Path $configCmd)) {
    throw "config.cmd not found in $RunnerDir. Extract the official GitHub runner package there."
}

$token = $env:RUNNER_TOKEN
if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Set RUNNER_TOKEN to the registration token from GitHub, then re-run:" -ForegroundColor Yellow
    Write-Host '  $env:RUNNER_TOKEN = "YOUR_TOKEN"'
    Write-Host "  .\scripts\setup-qa-runner.ps1"
    Write-Host ""
    Write-Host "Optional: enable long paths (Node.js builds):" -ForegroundColor Yellow
    Write-Host '  New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force'
    exit 0
}

Push-Location $RunnerDir
try {
    & .\config.cmd --url $RepoUrl --token $token --name $RunnerName --labels $Labels --unattended --replace
    if ($LASTEXITCODE -ne 0) {
        throw "config.cmd failed with exit code $LASTEXITCODE"
    }
    Write-Host ""
    Write-Host "Runner configured. Start it:" -ForegroundColor Green
    Write-Host "  cd $RunnerDir"
    Write-Host "  .\run.cmd"
    Write-Host ""
    Write-Host "For a Windows service, see GitHub runner docs to install as a service."
}
finally {
    Pop-Location
}
