@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "Update: Force Vercel deployment with git configuration"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 