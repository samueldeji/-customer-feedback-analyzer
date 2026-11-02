# customer-feedback-analyzer
# scripts/import-workflows.ps1
# Imports built workflow JSON files from n8n/dist into n8n (npm or Docker mode).

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$envPath = Join-Path $projectRoot ".env"

if (-not (Test-Path $envPath)) {
  Write-Error "Could not find .env file at $envPath"
  exit 1
}

$distDir = Join-Path $projectRoot "n8n\dist"
if (-not (Test-Path $distDir)) {
  Write-Error "No workflows found in $distDir. Run 'npm run workflows:build' first."
  exit 1
}

$n8nMode = "npm"
Get-Content $envPath | ForEach-Object {
  if ($_ -match "^\s*N8N_MODE\s*=\s*(.+)$") {
    $n8nMode = $matches[1].Trim()
  }
}

Write-Host "Importing workflows using mode: $n8nMode..." -ForegroundColor Cyan

if ($n8nMode -eq "docker") {
  docker cp "$distDir" n8n:/tmp/cfa
  docker exec n8n n8n import:workflow --separate --input=/tmp/cfa
} elseif ($n8nMode -eq "npm") {
  n8n import:workflow --separate "--input=$distDir"
} else {
  Write-Error "Unknown N8N_MODE: $n8nMode (expected 'npm' or 'docker')"
  exit 1
}

Write-Host ""
Write-Host "Import completed successfully." -ForegroundColor Green
Write-Host "Remember to open the n8n editor (http://localhost:5678) and ACTIVATE:" -ForegroundColor Yellow
Write-Host "  - CFA 01 - Feedback Processor" -ForegroundColor Yellow
Write-Host "  - CFA 02 - Gmail Intake" -ForegroundColor Yellow
Write-Host "  - CFA 04 - Weekly Digest" -ForegroundColor Yellow
Write-Host "  - CFA 05 - Dashboard API" -ForegroundColor Yellow
Write-Host "(CFA 03 - Google Reviews Intake should only be activated if Google Places is configured)" -ForegroundColor DarkGray
