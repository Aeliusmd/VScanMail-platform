# =============================================================
#  VScanMail — MySQL Database Backup to GitHub
#  Schedule this with Windows Task Scheduler (daily recommended)
# =============================================================

# --- Configuration — edit these if your settings change ------
$DB_HOST    = "127.0.0.1"
$DB_PORT    = "3308"
$DB_NAME    = "vscanmail"
$DB_USER    = "root"
$DB_PASS    = "test@123"

# Folder where you cloned your private backup GitHub repo
$BACKUP_DIR = "C:\vscanmail-backups"

# Delete dump files older than this many days (keeps repo small)
$KEEP_DAYS  = 30

# Full path to mysqldump.exe
$candidates = @(
    "C:\Program Files\MySQL\MySQL Server 9.2\bin\mysqldump.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe",
    "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe",
    "C:\Program Files\MySQL\MySQL Server 9.0\bin\mysqldump.exe",
    "C:\xampp\mysql\bin\mysqldump.exe",
    "C:\laragon\bin\mysql\mysql-8.0\bin\mysqldump.exe",
    "C:\laragon\bin\mysql\mysql-8.4\bin\mysqldump.exe"
)
$MYSQLDUMP = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $MYSQLDUMP) {
    # Last resort: search Program Files
    $MYSQLDUMP = Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter "mysqldump.exe" -ErrorAction SilentlyContinue |
                 Select-Object -First 1 -ExpandProperty FullName
}
if (-not $MYSQLDUMP) {
    Write-Error "Cannot find mysqldump.exe. Set the path manually in this script."
    exit 1
}
Write-Host "Using mysqldump: $MYSQLDUMP"
# -------------------------------------------------------------

Set-Location $BACKUP_DIR

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm"
$filename  = "backup_$timestamp.sql"
$filepath  = Join-Path $BACKUP_DIR $filename

Write-Host "Starting backup: $filename"

# Pass password via environment variable (avoids it appearing in process list)
$env:MYSQL_PWD = $DB_PASS

& $MYSQLDUMP `
    --host=$DB_HOST `
    --port=$DB_PORT `
    --user=$DB_USER `
    --single-transaction `
    --routines `
    --triggers `
    --no-tablespaces `
    $DB_NAME | Out-File -FilePath $filepath -Encoding UTF8

Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $filepath) -or (Get-Item $filepath).Length -lt 100) {
    Write-Error "mysqldump failed or produced an empty file. Aborting."
    exit 1
}

Write-Host "Dump size: $([Math]::Round((Get-Item $filepath).Length / 1KB, 1)) KB"

# --- Remove old backups beyond retention window ---------------
$removed = 0
Get-ChildItem $BACKUP_DIR -Filter "backup_*.sql" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KEEP_DAYS) } |
    ForEach-Object { Remove-Item $_.FullName -Force; $removed++ }

if ($removed -gt 0) { Write-Host "Removed $removed old backup(s)." }

# --- Commit and push to GitHub --------------------------------
git add -A

$status = git status --porcelain
if (-not $status) {
    Write-Host "Nothing new to commit."
    exit 0
}

git commit -m "backup: $timestamp"
git push origin main

Write-Host "Backup pushed to GitHub successfully."
