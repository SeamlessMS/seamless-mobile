@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: Comprehensive CORS setup for API - 1) Updated CORS headers for better security 2) Added proper charset and content-type handling 3) Improved request logging 4) Added API version tracking 5) Restricted methods to POST/OPTIONS only"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 