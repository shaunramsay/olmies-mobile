$ErrorActionPreference = "Stop"

Write-Host "Checking Docker status..."
$dockerProcess = Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

if (-not $dockerProcess) {
    Write-Host "Starting Docker Desktop..."
    
    $dockerPath = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerPath) {
        Start-Process $dockerPath
    } else {
        Write-Host "Could not find Docker Desktop at $dockerPath. Please start it manually." -ForegroundColor Red
    }
} else {
    Write-Host "Docker Desktop process is already running."
}

Write-Host "Waiting for Docker daemon to be ready (this may take a minute)..."
$dockerReady = $false
$maxAttempts = 60
$attempts = 0

while (-not $dockerReady -and $attempts -lt $maxAttempts) {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerReady = $true
        Write-Host "`nDocker is ready!" -ForegroundColor Green
    } else {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
        $attempts++
    }
}

if (-not $dockerReady) {
    Write-Host "`nTimed out waiting for Docker. Please verify Docker Desktop is working." -ForegroundColor Red
    exit
}

Write-Host "`nStarting Services..."

# 1. Start Database
Write-Host "1. Starting PostgreSQL Database..."
Set-Location "c:\Users\Shaun Ramsay\Desktop\olmies-ai"

# Remove the existing container if it's conflicting (the data is safe in the volume)
docker rm -f olmies_postgres 2>$null | Out-Null

docker-compose up -d

# 2. Wait a moment for DB to initialize
Start-Sleep -Seconds 3

# 3. Start API in a new PowerShell window
Write-Host "2. Starting .NET API Backend in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\Shaun Ramsay\Desktop\olmies-ai\src\Olmies.Api'; dotnet run"

# 4. Start Expo in a new PowerShell window
Write-Host "3. Starting Expo Mobile App (Web Mode) in a new window..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\Shaun Ramsay\Desktop\olmies-mobile'; npx expo start --web -c"

Write-Host "`nDev environment started! Two new windows should have opened for your API and Expo process." -ForegroundColor Green
