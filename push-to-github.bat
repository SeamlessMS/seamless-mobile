@echo off
"C:\Program Files\Git\cmd\git.exe" init
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "Initial commit: Seamless Mobile Services"
"C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/SeamlessMS/seamless-mobile.git
"C:\Program Files\Git\cmd\git.exe" push -u origin master
pause 