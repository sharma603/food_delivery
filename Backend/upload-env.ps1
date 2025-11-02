# PowerShell Script to Upload .env File to Hostinger VPS
# Run this script from your local Backend folder

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$ServerPath,
    
    [string]$Username = "root"
)

Write-Host "📤 Uploading .env file to server..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found in current directory!" -ForegroundColor Red
    Write-Host "Please run this script from the Backend folder." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found .env file" -ForegroundColor Green
Write-Host "📋 Server IP: $ServerIP" -ForegroundColor Yellow
Write-Host "📂 Server Path: $ServerPath" -ForegroundColor Yellow
Write-Host ""

# Upload using SCP
try {
    Write-Host "Uploading .env file..." -ForegroundColor Cyan
    scp .env "${Username}@${ServerIP}:${ServerPath}/.env"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ .env file uploaded successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. SSH into server: ssh ${Username}@${ServerIP}" -ForegroundColor White
        Write-Host "   2. Verify file: cat ${ServerPath}/.env" -ForegroundColor White
        Write-Host "   3. Set permissions: chmod 600 ${ServerPath}/.env" -ForegroundColor White
        Write-Host "   4. Start server: pm2 start ecosystem.config.js --env production" -ForegroundColor White
    } else {
        Write-Host ""
        Write-Host "❌ Upload failed. Please check:" -ForegroundColor Red
        Write-Host "   - Server IP is correct" -ForegroundColor Yellow
        Write-Host "   - Server path is correct" -ForegroundColor Yellow
        Write-Host "   - SSH access is working" -ForegroundColor Yellow
        Write-Host "   - You have permission to write to that path" -ForegroundColor Yellow
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Use WinSCP or FileZilla for GUI upload" -ForegroundColor Yellow
}

