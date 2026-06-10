# Vision-Enhanced Single Bug Fixer
# Usage:
#   .\scripts\fix-bug.ps1 -Id 16068
#   .\scripts\fix-bug.ps1 -Name "Remember Me"
#   .\scripts\fix-bug.ps1 -Id 16068 -DryRun
#
# Required env vars:
#   $env:AZURE_DEVOPS_PAT   — Azure DevOps PAT
#   $env:ANTHROPIC_API_KEY  — Anthropic API key

param(
    [string]$Id = "",
    [string]$Name = "",
    [switch]$DryRun,
    [string]$Project = "Medcube AI",
    [string]$Org = "MedCubeUSA"
)

if (-not $Id -and -not $Name) {
    Write-Host "Usage: .\scripts\fix-bug.ps1 -Id 16068" -ForegroundColor Yellow
    Write-Host "       .\scripts\fix-bug.ps1 -Name `"Remember Me`"" -ForegroundColor Yellow
    exit 1
}

if (-not $env:AZURE_DEVOPS_PAT) {
    Write-Error "AZURE_DEVOPS_PAT not set. Set it with: `$env:AZURE_DEVOPS_PAT = 'your-token'"
    exit 1
}

if (-not $env:ANTHROPIC_API_KEY) {
    Write-Error "ANTHROPIC_API_KEY not set. Set it with: `$env:ANTHROPIC_API_KEY = 'sk-ant-...'"
    exit 1
}

$nodeArgs = @("scripts/fix-bug.mjs", "--org", $Org, "--project", $Project)

if ($Id)      { $nodeArgs += @("--id", $Id) }
if ($Name)    { $nodeArgs += @("--name", $Name) }
if ($DryRun)  { $nodeArgs += "--dry-run" }

Write-Host ""
Write-Host "[fix-bug] Starting vision-enhanced bug fix..." -ForegroundColor Cyan
if ($Id)   { Write-Host "  Bug ID  : $Id" }
if ($Name) { Write-Host "  Bug Name: $Name" }
Write-Host ""

node @nodeArgs
