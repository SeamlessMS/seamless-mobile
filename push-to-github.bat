@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "refactor: Use environment variables for API URLs - Replaced hardcoded URLs with NEXT_PUBLIC_API_URL env variable for better configuration management"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 