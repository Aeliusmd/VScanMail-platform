# QA Bug Auto-Fix Pipeline
# Usage: .\scripts\qa-auto-fix.ps1 [-Project "Medcube AI"] [-State "Active"] [-Tag "QA"] [-DryRun]
#
# Prerequisites:
#   $env:AZURE_DEVOPS_PAT  - Azure DevOps Personal Access Token (Work Items: Read/Write, Code: Read)
#   claude CLI installed and authenticated

param(
    [string]$Organization = "MedCubeUSA",
    [string]$Project = "Medcube AI",
    [string]$State = "Active",
    [string]$Tag = "",
    [string]$AssignedTo = "",
    [int]$MaxBugs = 5,
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -- Validate prerequisites ----------------------------------------------------
if (-not $env:AZURE_DEVOPS_PAT) {
    Write-Error "AZURE_DEVOPS_PAT environment variable not set."
    Write-Host "Get a PAT from: https://dev.azure.com/$Organization/_usersSettings/tokens" -ForegroundColor Yellow
    exit 1
}

$claudeCmd = (Get-Command claude -ErrorAction SilentlyContinue)
if (-not $claudeCmd) {
    Write-Error "claude CLI not found. Run: npm install -g @anthropic-ai/claude-code"
    exit 1
}

# -- Azure DevOps REST helpers --------------------------------------------------
$base64Pat = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$env:AZURE_DEVOPS_PAT"))
$headers = @{
    Authorization  = "Basic $base64Pat"
    "Content-Type" = "application/json"
}
$baseUrl = "https://dev.azure.com/$Organization"
$encodedProject = [Uri]::EscapeDataString($Project)

function Invoke-AzDo {
    param([string]$Uri, [string]$Method = "GET", [object]$Body = $null)
    $params = @{ Uri = $Uri; Headers = $headers; Method = $Method }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json -Depth 10) }
    Invoke-RestMethod @params
}

# -- Build WIQL query -----------------------------------------------------------
$conditions = @(
    "[System.TeamProject] = '$Project'",
    "[System.WorkItemType] = 'Bug'",
    "[System.State] = '$State'"
)
if ($Tag)        { $conditions += "[System.Tags] Contains '$Tag'" }
if ($AssignedTo) { $conditions += "[System.AssignedTo] = '$AssignedTo'" }

$wiql = "SELECT [System.Id],[System.Title],[System.Description],[Microsoft.VSTS.TCM.ReproSteps] FROM workitems WHERE $($conditions -join ' AND ') ORDER BY [System.ChangedDate] DESC"

Write-Host ""
Write-Host "[QA Auto-Fix] Querying Azure DevOps for bugs..." -ForegroundColor Cyan
Write-Host "  Project : $Project"
Write-Host "  State   : $State"
if ($Tag) { Write-Host "  Tag     : $Tag" }
Write-Host ""

# -- Fetch work item IDs --------------------------------------------------------
$wiqlUrl  = "$baseUrl/$encodedProject/_apis/wit/wiql?api-version=7.1"
$wiqlResp = Invoke-AzDo -Uri $wiqlUrl -Method POST -Body @{ query = $wiql }

$ids = @($wiqlResp.workItems | Select-Object -First $MaxBugs -ExpandProperty id)
if ($ids.Count -eq 0) {
    Write-Host "[QA Auto-Fix] No bugs found matching criteria." -ForegroundColor Green
    exit 0
}

Write-Host "[QA Auto-Fix] Found $($ids.Count) bug(s). Processing..." -ForegroundColor Yellow

# -- Process each bug -----------------------------------------------------------
$results = @()

foreach ($id in $ids) {
    $detailUrl = "$baseUrl/_apis/wit/workitems/${id}?`$expand=all&api-version=7.1"
    $item      = Invoke-AzDo -Uri $detailUrl

    $title      = $item.fields."System.Title"
    $desc       = $item.fields."System.Description" -replace '<[^>]+>', ''
    $reproSteps = $item.fields."Microsoft.VSTS.TCM.ReproSteps" -replace '<[^>]+>', ''
    $acceptCrit = $item.fields."Microsoft.VSTS.Common.AcceptanceCriteria" -replace '<[^>]+>', ''
    $workUrl    = "$baseUrl/$encodedProject/_workitems/edit/$id"

    Write-Host ""
    Write-Host "--------------------------------------------" -ForegroundColor DarkGray
    Write-Host "Bug #$id : $title" -ForegroundColor White
    Write-Host "  URL: $workUrl" -ForegroundColor DarkGray

    if ($DryRun) {
        Write-Host "  [DRY RUN] Skipping claude invocation." -ForegroundColor DarkYellow
        $results += [pscustomobject]@{ Id=$id; Title=$title; Status="DryRun"; Branch="" }
        continue
    }

    # Create a feature branch for this bug fix
    $safeName   = ($title -replace '[^a-zA-Z0-9]', '-').ToLower().TrimEnd('-')
    if ($safeName.Length -gt 40) { $safeName = $safeName.Substring(0, 40) }
    $branchName = "fix/ado-bug-$id-$safeName"

    git checkout -b $branchName 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        git checkout $branchName 2>&1 | Out-Null
    }

    # Build the prompt for Claude - NOTE: closing "@ MUST be at column 0
    $prompt = @"
You are fixing a QA bug reported in Azure DevOps.

WORK ITEM: #$id
TITLE: $title
URL: $workUrl

DESCRIPTION:
$desc

REPRO STEPS:
$reproSteps

ACCEPTANCE CRITERIA:
$acceptCrit

PROJECT CONTEXT:
- This is a Next.js + Node.js application (VScanmail / Medcube AI)
- Backend: app/api/** (Next.js route handlers)
- Frontend: frontend/src/**
- Lib: lib/modules/**

TASK:
1. Analyze the bug description and repro steps carefully
2. Search the codebase for the relevant files
3. Identify the root cause
4. Fix the bug with minimal change, no scope creep
5. Summarize: which files changed, what was wrong, what you changed

RULES:
- Do NOT add unnecessary comments or refactors
- Do NOT break existing tests
- If the bug is unclear, output exactly: NEEDS_CLARIFICATION: <reason>
"@

    Write-Host "  Running claude to analyze and fix..." -ForegroundColor Cyan

    $fixOutput = $prompt | claude --print --no-markdown 2>&1
    $exitCode  = $LASTEXITCODE

    if ($exitCode -ne 0 -or ($fixOutput -join "`n") -match "^NEEDS_CLARIFICATION:") {
        Write-Host "  Could not auto-fix." -ForegroundColor Red
        git checkout - 2>&1 | Out-Null
        git branch -D $branchName 2>&1 | Out-Null
        $results += [pscustomobject]@{ Id=$id; Title=$title; Status="NeedsReview"; Branch="" }
        continue
    }

    # Stage and commit any changes
    $changedFiles = git status --porcelain
    if (-not $changedFiles) {
        Write-Host "  No file changes - bug may be env-specific or already fixed." -ForegroundColor DarkYellow
        git checkout - 2>&1 | Out-Null
        git branch -D $branchName 2>&1 | Out-Null
        $results += [pscustomobject]@{ Id=$id; Title=$title; Status="NoChanges"; Branch="" }
        continue
    }

    git add -A
    $commitMsg = "fix: resolve ADO Bug #$id - $title`n`nAuto-fixed via qa-auto-fix pipeline.`nWork item: $workUrl"
    git commit -m $commitMsg

    Write-Host "  Fixed and committed on branch: $branchName" -ForegroundColor Green

    # Post a comment on the work item
    $commentUrl  = "$baseUrl/$encodedProject/_apis/wit/workitems/${id}/comments?api-version=7.1-preview.3"
    $commentText = "Auto-fix applied by qa-auto-fix pipeline. Branch: $branchName. Please review and merge."
    try { Invoke-AzDo -Uri $commentUrl -Method POST -Body @{ text = $commentText } | Out-Null } catch {}

    git checkout - 2>&1 | Out-Null
    $results += [pscustomobject]@{ Id=$id; Title=$title; Status="Fixed"; Branch=$branchName }
}

# -- Summary -------------------------------------------------------------------
Write-Host ""
Write-Host "--------------------------------------------" -ForegroundColor DarkGray
Write-Host "[QA Auto-Fix] Summary:" -ForegroundColor Cyan
$results | Format-Table -AutoSize

$fixedCount = ($results | Where-Object { $_.Status -eq "Fixed" }).Count
$color = if ($fixedCount -gt 0) { "Green" } else { "Yellow" }
Write-Host "[QA Auto-Fix] Done. $fixedCount/$($results.Count) bugs auto-fixed." -ForegroundColor $color
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Review fix branches: git branch | Select-String fix/ado-bug"
Write-Host "  2. Push to remote and create PRs in Azure DevOps"
Write-Host "  3. NeedsReview bugs: manually investigate and fix"
