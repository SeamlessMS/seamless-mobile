# Start main server
Start-Process powershell -ArgumentList "npm run dev" -WindowStyle Normal

# Start auth server
Start-Process powershell -ArgumentList "npm run dev:auth" -WindowStyle Normal

# Start payment server
Start-Process powershell -ArgumentList "npm run dev:payment" -WindowStyle Normal

Write-Host "All servers are starting..."
Write-Host "Main server will be available at http://localhost:3000"
Write-Host "Auth server will be available at http://localhost:3001"
Write-Host "Payment server will be available at http://localhost:3002" 