@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "Update: Fix custom field names to match Zoho Desk API field names"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 