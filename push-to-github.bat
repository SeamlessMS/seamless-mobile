@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: API connectivity - Updated endpoint URL handling, added CORS mode, improved error logging. Changes: 1) Added dynamic API URL based on environment 2) Added detailed error logging 3) Improved CORS handling with proper headers"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 