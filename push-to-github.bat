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
"C:\Program Files\Git\cmd\git.exe" add public/*.html
"C:\Program Files\Git\cmd\git.exe" commit -m "Update location to Greenwood Village, CO"
"C:\Program Files\Git\cmd\git.exe" push
"C:\Program Files\Git\cmd\git.exe" add public/*.html
"C:\Program Files\Git\cmd\git.exe" commit -m "Update email address to cst@seamlessms.net"
"C:\Program Files\Git\cmd\git.exe" push
"C:\Program Files\Git\cmd\git.exe" add public/ticket-submission.html public/js/ticket-submission.js public/css/style.css
"C:\Program Files\Git\cmd\git.exe" commit -m "Update ticket submission form with new fields and service icons"
"C:\Program Files\Git\cmd\git.exe" push
"C:\Program Files\Git\cmd\git.exe" add public/about.html
"C:\Program Files\Git\cmd\git.exe" commit -m "Remove leadership team section from about page"
"C:\Program Files\Git\cmd\git.exe" push
pause 