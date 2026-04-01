# ================================================================
#  B12 Health Tracker Backend — ONE-TIME SETUP SCRIPT
#  Run this ONCE to install everything and register startup services
#  Usage: Right-click → "Run with PowerShell" (or run as Admin)
# ================================================================
#  Steps performed:
#   1. Install PostgreSQL via winget
#   2. Create database + user + run all migrations + seed questions
#   3. Install Python dependencies
#   4. Install PM2 globally
#   5. Start both services with PM2
#   6. Register PM2 as a Windows startup service (auto-starts on boot)
# ================================================================

$ErrorActionPreference = "Stop"
$BackendRoot = "D:\B12\backend-v2"
$NodeService = "$BackendRoot\node-service"
$PythonService = "$BackendRoot\python-service"

# DB credentials (must match .env files)
$DB_USER = "b12user"
$DB_PASS = "B12Health"
$DB_NAME = "b12db"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  B12 Backend — Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── STEP 1: Check / Install PostgreSQL ──────────────────────────────────────
Write-Host "[1/6] Checking PostgreSQL..." -ForegroundColor Yellow

$pgPath = "C:\Program Files\PostgreSQL\17\bin"
$pgPath16 = "C:\Program Files\PostgreSQL\16\bin"
$pgPath15 = "C:\Program Files\PostgreSQL\15\bin"

$psqlExe = $null
foreach ($path in @($pgPath, $pgPath16, $pgPath15)) {
    if (Test-Path "$path\psql.exe") {
        $psqlExe = "$path\psql.exe"
        $pgBin = $path
        Write-Host "    Found PostgreSQL at: $pgBin" -ForegroundColor Green
        break
    }
}

if (-not $psqlExe) {
    Write-Host "    PostgreSQL not found. Installing via winget..." -ForegroundColor Yellow
    winget install --id PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements
    
    # Refresh path and find install
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
    
    foreach ($path in @($pgPath, $pgPath16, $pgPath15)) {
        if (Test-Path "$path\psql.exe") {
            $psqlExe = "$path\psql.exe"
            $pgBin = $path
            break
        }
    }
    
    if (-not $psqlExe) {
        Write-Host ""
        Write-Host "    ERROR: PostgreSQL install not found after winget install." -ForegroundColor Red
        Write-Host "    Please install manually from: https://www.postgresql.org/download/windows/" -ForegroundColor Red
        Write-Host "    Then run this script again." -ForegroundColor Red
        exit 1
    }
    Write-Host "    PostgreSQL installed successfully." -ForegroundColor Green
}

# Add PostgreSQL bin to current session PATH
$env:PATH = "$pgBin;$env:PATH"

# ── STEP 2: Create Database + User + Run Migrations ─────────────────────────
Write-Host ""
Write-Host "[2/6] Setting up PostgreSQL database..." -ForegroundColor Yellow

# Check if b12db already exists
$dbExists = & $psqlExe -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>$null
if ($dbExists -eq "1") {
    Write-Host "    Database '$DB_NAME' already exists — skipping creation." -ForegroundColor Green
} else {
    Write-Host "    Creating user and database..." -ForegroundColor Yellow
    
    # Create user
    & $psqlExe -U postgres -c "DO `$`$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN CREATE USER $DB_USER WITH PASSWORD '$DB_PASS'; END IF; END `$`$;" 2>&1
    
    # Create database
    & $psqlExe -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>&1
    
    # Grant privileges
    & $psqlExe -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>&1
    
    Write-Host "    Running migrations..." -ForegroundColor Yellow
    $env:PGPASSWORD = $DB_PASS
    & $psqlExe -U $DB_USER -d $DB_NAME -f "$BackendRoot\database\migrations\001_core.sql"
    & $psqlExe -U $DB_USER -d $DB_NAME -f "$BackendRoot\database\migrations\002_questionnaire.sql"
    & $psqlExe -U $DB_USER -d $DB_NAME -f "$BackendRoot\database\migrations\003_checkin_streak.sql"
    & $psqlExe -U $DB_USER -d $DB_NAME -f "$BackendRoot\database\migrations\004_bmi.sql"

    Write-Host "    Seeding questions..." -ForegroundColor Yellow
    & $psqlExe -U $DB_USER -d $DB_NAME -f "$BackendRoot\database\seeds\questions_seed.sql"
    
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
    Write-Host "    Database ready." -ForegroundColor Green
}

# ── STEP 3: Install Python dependencies ─────────────────────────────────────
Write-Host ""
Write-Host "[3/6] Installing Python dependencies..." -ForegroundColor Yellow

Set-Location $PythonService

# Install without psycopg2-binary if PostgreSQL libs not in system
pip install fastapi uvicorn[standard] pydantic python-dotenv httpx sqlalchemy 2>&1 | Select-String "Successfully installed|already satisfied" | ForEach-Object { Write-Host "    $_" }

# Try psycopg2-binary (may need PostgreSQL client)
try {
    pip install psycopg2-binary 2>&1 | Out-Null
    Write-Host "    psycopg2-binary installed." -ForegroundColor Green
} catch {
    Write-Host "    psycopg2-binary skipped (not needed for scoring service)." -ForegroundColor Yellow
}

Write-Host "    Python dependencies ready." -ForegroundColor Green

# ── STEP 4: Install PM2 globally ────────────────────────────────────────────
Write-Host ""
Write-Host "[4/6] Installing PM2 (process manager)..." -ForegroundColor Yellow

Set-Location $BackendRoot
$pm2Exists = npm list -g pm2 2>&1 | Select-String "pm2"
if ($pm2Exists) {
    Write-Host "    PM2 already installed." -ForegroundColor Green
} else {
    npm install -g pm2
    Write-Host "    PM2 installed." -ForegroundColor Green
}

# Install pm2-windows-startup for truly persistent Windows startup
npm install -g pm2-windows-startup 2>&1 | Out-Null

# ── STEP 5: Start services with PM2 ─────────────────────────────────────────
Write-Host ""
Write-Host "[5/6] Starting services with PM2..." -ForegroundColor Yellow

Set-Location $BackendRoot

# Stop any existing PM2 instances first
pm2 delete b12-python-api 2>&1 | Out-Null
pm2 delete b12-node-api 2>&1 | Out-Null

# Start Python FastAPI (use direct uvicorn call for Windows compatibility)
pm2 start uvicorn --name b12-python-api -- main:app --host 0.0.0.0 --port 8000 `
    --cwd $PythonService `
    --log-date-format "YYYY-MM-DD HH:mm:ss" `
    --output "$BackendRoot\logs\python-api-out.log" `
    --error "$BackendRoot\logs\python-api-error.log"

# Wait for Python service to come up
Write-Host "    Waiting for Python API to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start Node.js API
pm2 start server.js --name b12-node-api `
    --cwd $NodeService `
    --log-date-format "YYYY-MM-DD HH:mm:ss" `
    --output "$BackendRoot\logs\node-api-out.log" `
    --error "$BackendRoot\logs\node-api-error.log"

Start-Sleep -Seconds 3

# ── STEP 6: Register Windows Startup ────────────────────────────────────────
Write-Host ""
Write-Host "[6/6] Registering PM2 as Windows startup service..." -ForegroundColor Yellow

# Save current PM2 process list
pm2 save

# Register startup (pm2-windows-startup creates a registry key)
pm2-startup install 2>&1 | Out-Null

Write-Host "    Startup registered — services will auto-start on Windows boot." -ForegroundColor Green

# ── DONE ─────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
pm2 list
Write-Host ""
Write-Host "  Node.js API  →  http://localhost:3000/health" -ForegroundColor Cyan
Write-Host "  Python API   →  http://localhost:8000/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "  USEFUL PM2 COMMANDS:" -ForegroundColor White
Write-Host "    pm2 list              — see all running services" -ForegroundColor Gray
Write-Host "    pm2 logs              — view live logs" -ForegroundColor Gray
Write-Host "    pm2 restart all       — restart both services" -ForegroundColor Gray
Write-Host "    pm2 stop all          — stop both services" -ForegroundColor Gray
Write-Host "    pm2 monit             — real-time dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "  ANDROID CONNECTION:" -ForegroundColor White
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
Write-Host "    Set BASE_URL = 'http://$($ip):3000' in your app" -ForegroundColor Yellow
Write-Host ""
