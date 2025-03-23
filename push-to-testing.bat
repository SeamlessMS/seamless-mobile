@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "Testing: %*"

echo Pushing to testing branch...
"C:\Program Files\Git\cmd\git.exe" push origin testing

echo Done!
pause 