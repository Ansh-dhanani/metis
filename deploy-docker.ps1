# Docker Deployment Script for Windows

Write-Host "🐳 Starting METIS Docker Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "📝 Please copy .env.example to .env and fill in your credentials:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Environment file found" -ForegroundColor Green
Write-Host ""

# Build and start containers
Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
docker-compose build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Starting services..." -ForegroundColor Cyan
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ METIS is now running!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 Service URLs:" -ForegroundColor Cyan
        Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
        Write-Host ""
        Write-Host "📝 View logs:" -ForegroundColor Cyan
        Write-Host "   docker-compose logs -f" -ForegroundColor White
        Write-Host ""
        Write-Host "🛑 Stop services:" -ForegroundColor Cyan
        Write-Host "   docker-compose down" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host "❌ Failed to start services" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
