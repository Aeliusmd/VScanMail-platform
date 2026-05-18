# QA CI/CD setup (Windows)

Automatic QA deploy when developers push **`dev_visal`** to GitHub.

| Machine | Role |
|---------|------|
| **10.103.0.91** (dev) | Manual `git push origin dev_visal` |
| **QA Windows** | Self-hosted runner + PM2 apps |
| **MySQL** | `10.103.0.91:3308` / `qa_vscanmail` / user `aiuser` (`.env.local`) |

## 1. One-time QA prerequisites

```powershell
# Node 20 LTS, Git — install if missing
npm install -g pm2

cd E:\Visal\VScanmail
git fetch origin
git checkout dev_visal
git branch -u origin/dev_visal dev_visal
```

Ensure `.env.local` and `frontend/.env.local` exist (not in git).

## 2. Install GitHub self-hosted runner

1. Open: https://github.com/Aeliusmd/VScanMail-platform/settings/actions/runners/new
2. Choose **Windows** / x64, download the runner zip.
3. Extract to `C:\actions-runner`.
4. Copy the **registration token** from GitHub.
5. On QA machine:

```powershell
cd E:\Visal\VScanmail
$env:RUNNER_TOKEN = "PASTE_TOKEN_HERE"
.\scripts\setup-qa-runner.ps1
cd C:\actions-runner
.\run.cmd
```

Runner labels must include: `self-hosted`, `Windows`, `qa` (set by `setup-qa-runner.ps1`).

Optional — long paths for Node builds (Admin PowerShell):

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

In GitHub → **Settings → Environments**, create environment **`qa`** (optional approval rules).

## 3. First production build + PM2

```powershell
cd E:\Visal\VScanmail
.\scripts\deploy-qa.ps1 -Branch dev_visal
pm2 save
pm2 startup   # run the command PM2 prints (Admin) for reboot persistence
```

Apps:

- API: http://localhost:3010
- UI: http://localhost:3001

## 4. Manual deploy (without GitHub)

```powershell
cd E:\Visal\VScanmail
.\scripts\deploy-qa.ps1 -Branch dev_visal
```

Optional migrations: `.\scripts\deploy-qa.ps1 -Branch dev_visal -RunMigrations`

## 5. Verify CI/CD

After dev pushes `dev_visal`, check:

1. GitHub → **Actions** → **Deploy QA** — green run on runner `qa-windows`.
2. `pm2 status` — `vscanmail-api` and `vscanmail-ui` online.
3. `.env.local` unchanged.

See [DEV_PUSH.md](./DEV_PUSH.md) for the dev server workflow.
