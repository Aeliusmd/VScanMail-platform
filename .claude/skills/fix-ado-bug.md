---
name: fix-ado-bug
description: Fetch a bug from Azure DevOps (with screenshots), understand it visually, fix the code, and verify. Triggered when user mentions a bug name or ID to fix.
---

The user wants to fix an Azure DevOps bug. Follow these steps precisely:

## 1. Get the bug identifier
Extract from the user's message:
- A bug **ID** (number like 16068) — use directly
- A bug **name/title** (text) — search Azure DevOps for it

## 2. Fetch bug from Azure DevOps

Run PowerShell to get full bug details with attachments:

```powershell
$pat = $env:AZURE_DEVOPS_PAT
if (-not $pat) { Write-Error "AZURE_DEVOPS_PAT not set"; exit 1 }
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{ Authorization = "Basic $base64"; "Content-Type" = "application/json" }
$baseUrl = "https://dev.azure.com/MedCubeUSA"
$proj = "Medcube%20AI"
```

**If bug ID known:**
```powershell
$item = Invoke-RestMethod "$baseUrl/_apis/wit/workitems/<ID>?`$expand=relations&api-version=7.1" -Headers $headers
```

**If searching by name:**
```powershell
$wiql = @{ query = "SELECT [System.Id],[System.Title] FROM workitems WHERE [System.TeamProject] = 'Medcube AI' AND [System.WorkItemType] = 'Bug' AND [System.Title] Contains '<NAME>' ORDER BY [System.ChangedDate] DESC" }
$search = Invoke-RestMethod "$baseUrl/$proj/_apis/wit/wiql?api-version=7.1" -Method POST -Headers $headers -Body ($wiql | ConvertTo-Json)
$id = $search.workItems[0].id
$item = Invoke-RestMethod "$baseUrl/_apis/wit/workitems/${id}?`$expand=relations&api-version=7.1" -Headers $headers
```

Extract fields:
```powershell
$title = $item.fields.'System.Title'
$desc  = $item.fields.'System.Description' -replace '<[^>]+>',''
$repro = $item.fields.'Microsoft.VSTS.TCM.ReproSteps' -replace '<[^>]+>',''
$accpt = $item.fields.'Microsoft.VSTS.Common.AcceptanceCriteria' -replace '<[^>]+>',''
$bugUrl = "$baseUrl/$proj/_workitems/edit/$id"
```

## 3. Download screenshots to logs/

```powershell
$imageExts = @('.png','.jpg','.jpeg','.gif','.webp','.bmp')
$images = $item.relations | Where-Object {
    $_.rel -eq 'AttachedFile' -and
    $imageExts -contains ([IO.Path]::GetExtension($_.attributes.name).ToLower())
}

$downloadedPaths = @()
foreach ($img in $images) {
    $fname = "bug${id}-$($img.attributes.name)"
    $dest  = "logs/$fname"
    Write-Host "Downloading: $($img.attributes.name)"
    Invoke-WebRequest $img.url -Headers @{ Authorization = "Basic $base64" } -OutFile $dest
    $downloadedPaths += $dest
}
Write-Host "Downloaded $($downloadedPaths.Count) screenshot(s)"
```

## 4. Read & understand the screenshots

For **each downloaded image**, use the **Read tool** to view it (Claude is multimodal and can see images). Analyze:
- What UI element is broken/missing?
- What does the current state look like?
- What should it look like per the acceptance criteria?

## 5. Fix with /team auto

Invoke `/team auto` with this context:
- Full bug details (title, description, repro steps, acceptance criteria)
- Visual analysis from screenshots
- Project structure (Next.js, app/api/**, frontend/src/**)
- Task: find root cause, fix minimally, verify TypeScript compiles

## 6. Report back

Tell the user:
- Bug title and ID
- What was visually wrong (from screenshots)
- Root cause found in code
- Files changed and what was changed
- Whether TypeScript check passed
- QA criteria met? Yes/No
- Any security concerns found?
