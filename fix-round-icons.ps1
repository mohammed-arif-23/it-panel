# Create round icons by copying launcher icons
$densities = @("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi")

foreach ($density in $densities) {
    $sourcePath = "android\app\src\main\res\mipmap-$density\ic_launcher.png"
    $targetPath = "android\app\src\main\res\mipmap-$density\ic_launcher_round.png"
    
    if (Test-Path $sourcePath) {
        Copy-Item $sourcePath $targetPath -Force
        Write-Host "✅ Created ic_launcher_round.png in mipmap-$density" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Source not found: $sourcePath" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Round icons created successfully!" -ForegroundColor Green
Write-Host "Now run: cd android && .\gradlew clean assembleDebug" -ForegroundColor Cyan
