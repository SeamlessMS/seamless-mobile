@echo off
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Initial commit: Seamless Mobile Services"
"C:\Program Files\Git\cmd\git.exe" push -u origin master
"C:\Program Files\Git\cmd\git.exe" add vercel.json
"C:\Program Files\Git\cmd\git.exe" commit -m "Update Vercel configuration for static deployment"
"C:\Program Files\Git\cmd\git.exe" push
"C:\Program Files\Git\cmd\git.exe" add public/css/style.css
"C:\Program Files\Git\cmd\git.exe" commit -m "Optimize popup for mobile devices"
"C:\Program Files\Git\cmd\git.exe" push
pause 