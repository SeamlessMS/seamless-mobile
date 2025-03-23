@echo off
echo Adding all changes...
"C:\Program Files\Git\cmd\git.exe" add .

echo Committing changes...
"C:\Program Files\Git\cmd\git.exe" commit -m "feat: Add service icons to ticket submission form - 1) Added service type icons in dropdown menu 2) Created custom CSS for icon styling 3) Added JavaScript for dynamic icon updates 4) Generated service-specific icons with brand colors 5) Ensured proper static file serving"

echo Pushing to GitHub...
"C:\Program Files\Git\cmd\git.exe" push

echo Done!
pause 