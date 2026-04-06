# Firebase Deployment Instructions for Artemis II Mission Control (Windows)

Write-Host "=== Artemis II Mission Control - Firebase Deployment ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To deploy this app to Firebase, follow these steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Install Firebase CLI globally (if not already installed):" -ForegroundColor Green
Write-Host "   npm install -g firebase-tools"
Write-Host ""
Write-Host "2. Login to Firebase:" -ForegroundColor Green
Write-Host "   firebase login"
Write-Host "   (This will open a browser for authentication with your Google account)"
Write-Host ""
Write-Host "3. Navigate to project and deploy:" -ForegroundColor Green
Write-Host "   cd D:\artemis2"
Write-Host "   firebase deploy"
Write-Host ""
Write-Host "4. Your app will be deployed to:" -ForegroundColor Cyan
Write-Host "   https://artemisii.firebaseapp.com" -ForegroundColor White -BackgroundColor Blue
Write-Host "   https://artemisii.web.app" -ForegroundColor White -BackgroundColor Blue
Write-Host ""
Write-Host "Firebase Configuration:" -ForegroundColor Yellow
Write-Host "  Project ID: artemisii"
Write-Host "  Auth Domain: artemisii.firebaseapp.com"
Write-Host "  Storage Bucket: artemisii.firebasestorage.app"
Write-Host ""
Write-Host "The deployment is configured in firebase.json to serve:" -ForegroundColor Yellow
Write-Host "  Public directory: . (root directory)"
Write-Host "  Main file: artemis-mission-control_17.html"
Write-Host ""
