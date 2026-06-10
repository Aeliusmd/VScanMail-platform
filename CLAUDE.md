# VScanmail / Medcube AI — Claude Instructions

## Project Stack
- **Backend**: Next.js route handlers in `app/api/**`
- **Frontend**: Next.js app in `frontend/src/**`
- **Shared lib**: `lib/modules/**`
- **DB**: MySQL via Drizzle ORM (`lib/modules/core/db/`)
- **Auth**: JWT + bcrypt, cookies (`sb-access-token`)

## QA Bug Fix Workflow

When the user says something like **"fix bug #16068"**, **"fix bug 'Remember Me'"**, or **"bug X hadaranna"**, follow this exact protocol:

### Step 1 — Fetch Bug from Azure DevOps
Run PowerShell to get bug details + attachments:
```powershell
$pat = $env:AZURE_DEVOPS_PAT
$base64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes(":$pat"))
$headers = @{ Authorization = "Basic $base64"; "Content-Type" = "application/json" }

# If user gave a bug ID directly:
$item = Invoke-RestMethod "https://dev.azure.com/MedCubeUSA/Medcube%20AI/_apis/wit/workitems/<ID>?`$expand=relations&api-version=7.1" -Headers $headers

# If user gave a name, first search:
$wiql = @{ query = "SELECT [System.Id] FROM workitems WHERE [System.TeamProject] = 'Medcube AI' AND [System.WorkItemType] = 'Bug' AND [System.Title] Contains '<NAME>'" }
$resp = Invoke-RestMethod "https://dev.azure.com/MedCubeUSA/Medcube%20AI/_apis/wit/wiql?api-version=7.1" -Method POST -Headers $headers -Body ($wiql | ConvertTo-Json)
```

### Step 2 — Download Screenshots to logs/
```powershell
$imageExts = @('.png','.jpg','.jpeg','.gif','.webp')
$attachments = $item.relations | Where-Object { $_.rel -eq 'AttachedFile' }
$images = $attachments | Where-Object { $imageExts -contains [IO.Path]::GetExtension($_.attributes.name).ToLower() }

foreach ($img in $images) {
    $dest = "logs/bug-$id-$($img.attributes.name)"
    Invoke-WebRequest $img.url -Headers @{ Authorization = "Basic $base64" } -OutFile $dest
}
```

### Step 3 — Read & Understand
- Use the **Read tool** to view each downloaded screenshot (Claude is multimodal)
- Read the bug title, description, repro steps, acceptance criteria
- Understand BOTH the text description AND the visual screenshots

### Step 4 — Fix with /team auto
Invoke `/team auto` with full context:
- Bug title, description, repro steps
- Visual analysis of screenshots
- Which files to look at
- What needs to change

### Step 5 — Report
After fix:
- List all changed files
- Explain what was wrong and what was fixed
- Note any TypeScript errors if found
- State whether QA criteria are met

## Azure DevOps Config
- **Org**: MedCubeUSA
- **Project**: Medcube AI
- **PAT env var**: `AZURE_DEVOPS_PAT`
- **Work items URL**: https://dev.azure.com/MedCubeUSA/Medcube%20AI/_workitems/

## Code Conventions
- No unnecessary comments
- Minimal change — only fix what the bug describes
- TypeScript strict — no `any` unless existing pattern uses it
- Tailwind CSS for frontend styling
