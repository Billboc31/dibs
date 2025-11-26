# Script PowerShell pour créer les secrets Vercel
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Creation des secrets Vercel pour DIBS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Supabase
Write-Host "[1/7] Creation du secret supabase-url..." -ForegroundColor Yellow
vercel secrets add supabase-url "https://uiksbhgojgvytapelbuq.supabase.co"

Write-Host "[2/7] Creation du secret supabase-anon-key..." -ForegroundColor Yellow
vercel secrets add supabase-anon-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3NiaGdvamd2eXRhcGVsYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjI5MTAsImV4cCI6MjA3ODYzODkxMH0.BLpsZTEgGJbPOfO7vHY8uE43cA7_gpKLw5kElhZLGxc"

Write-Host "[3/7] Creation du secret supabase-service-key..." -ForegroundColor Yellow
vercel secrets add supabase-service-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3NiaGdvamd2eXRhcGVsYnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MjkxMCwiZXhwIjoyMDc4NjM4OTEwfQ.O6-_N9w6Sx11XNOVOuPXS9Y_uenqsKHMRT8CNvEmLG8"

# Spotify
Write-Host "[4/7] Creation du secret spotify-client-id..." -ForegroundColor Yellow
vercel secrets add spotify-client-id "7552cb4398ce47c588e72d59219dc512"

Write-Host "[5/7] Creation du secret spotify-client-secret..." -ForegroundColor Yellow
vercel secrets add spotify-client-secret "65e2aad7b20443b3b8964e58a9528841"

# URLs - A MODIFIER APRES LE PREMIER DEPLOIEMENT
Write-Host "[6/7] Creation du secret spotify-redirect-uri..." -ForegroundColor Yellow
Write-Host "ATTENTION: Remplace TON-APP-VERCEL par ton URL reelle!" -ForegroundColor Red
vercel secrets add spotify-redirect-uri "https://TON-APP-VERCEL.vercel.app/api/auth/spotify/callback"

Write-Host "[7/7] Creation du secret base-url..." -ForegroundColor Yellow
Write-Host "ATTENTION: Remplace TON-APP-VERCEL par ton URL reelle!" -ForegroundColor Red
vercel secrets add base-url "https://TON-APP-VERCEL.vercel.app"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Secrets crees avec succes!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host "1. Va sur vercel.com et deploie ton projet"
Write-Host "2. Note ton URL Vercel (ex: https://dibs-abc123.vercel.app)"
Write-Host "3. Mets a jour les 2 derniers secrets avec ta vraie URL:"
Write-Host "   vercel secrets rm spotify-redirect-uri" -ForegroundColor Yellow
Write-Host "   vercel secrets add spotify-redirect-uri 'https://TON-URL/api/auth/spotify/callback'" -ForegroundColor Yellow
Write-Host "   vercel secrets rm base-url" -ForegroundColor Yellow
Write-Host "   vercel secrets add base-url 'https://TON-URL'" -ForegroundColor Yellow
Write-Host "4. Redeploy sur Vercel"
Write-Host "5. Configure Spotify Developer avec la meme URL de callback"
Write-Host ""

