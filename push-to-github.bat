@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: Enhanced API configuration and error handling - 1) Updated CORS headers to allow all origins during development 2) Added detailed request logging in serverless function 3) Improved error handling and response formatting 4) Added proper caching headers for static files 5) Simplified request validation and processing"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 