@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "Update Vercel configuration to fix deployment issues - Simplified vercel.json to focus on static file serving and essential routes"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push origin clean-master

echo Done!
pause 