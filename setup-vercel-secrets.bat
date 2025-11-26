@echo off
echo ========================================
echo Creation des secrets Vercel pour DIBS
echo ========================================
echo.

REM Supabase
echo [1/7] Creation du secret supabase-url...
vercel secrets add supabase-url "https://uiksbhgojgvytapelbuq.supabase.co"

echo [2/7] Creation du secret supabase-anon-key...
vercel secrets add supabase-anon-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3NiaGdvamd2eXRhcGVsYnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNjI5MTAsImV4cCI6MjA3ODYzODkxMH0.BLpsZTEgGJbPOfO7vHY8uE43cA7_gpKLw5kElhZLGxc"

echo [3/7] Creation du secret supabase-service-key...
vercel secrets add supabase-service-key "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpa3NiaGdvamd2eXRhcGVsYnVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA2MjkxMCwiZXhwIjoyMDc4NjM4OTEwfQ.O6-_N9w6Sx11XNOVOuPXS9Y_uenqsKHMRT8CNvEmLG8"

REM Spotify
echo [4/7] Creation du secret spotify-client-id...
vercel secrets add spotify-client-id "7552cb4398ce47c588e72d59219dc512"

echo [5/7] Creation du secret spotify-client-secret...
vercel secrets add spotify-client-secret "65e2aad7b20443b3b8964e58a9528841"

REM URLs - A MODIFIER APRES LE PREMIER DEPLOIEMENT
echo [6/7] Creation du secret spotify-redirect-uri...
echo ATTENTION: Remplace TON-APP-VERCEL par ton URL reelle!
vercel secrets add spotify-redirect-uri "https://TON-APP-VERCEL.vercel.app/api/auth/spotify/callback"

echo [7/7] Creation du secret base-url...
echo ATTENTION: Remplace TON-APP-VERCEL par ton URL reelle!
vercel secrets add base-url "https://TON-APP-VERCEL.vercel.app"

echo.
echo ========================================
echo Secrets crees avec succes!
echo ========================================
echo.
echo PROCHAINES ETAPES:
echo 1. Va sur vercel.com et deploie ton projet
echo 2. Note ton URL Vercel (ex: https://dibs-abc123.vercel.app)
echo 3. Mets a jour les 2 derniers secrets avec ta vraie URL:
echo    vercel secrets rm spotify-redirect-uri
echo    vercel secrets add spotify-redirect-uri "https://TON-URL/api/auth/spotify/callback"
echo    vercel secrets rm base-url
echo    vercel secrets add base-url "https://TON-URL"
echo 4. Redeploy sur Vercel
echo 5. Configure Spotify Developer avec la meme URL de callback
echo.
pause

