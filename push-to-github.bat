@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: Proper API configuration for Vercel - 1) Removed process.env usage from client-side code 2) Added window.CONFIG for API configuration 3) Added fallback to window.location.origin"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 