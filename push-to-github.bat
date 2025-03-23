@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: Update API endpoint domain - Changed API URL from seamless-mobile.vercel.app to www.seamlessms.net to match production environment"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 