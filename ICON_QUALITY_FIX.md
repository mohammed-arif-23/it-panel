# Fix App Icon Quality

## Issue
The app icon appears blurry/low quality because:
1. Icons need to be adaptive icons (separate foreground/background)
2. Need proper high-resolution source file
3. Need to generate all density-specific versions correctly

## Solution: Use Online Icon Generator

### **Recommended: icon.kitchen (Best Quality)**

1. **Visit**: https://icon.kitchen/

2. **Upload your icon**:
   - Use: `public/icons/android/android-launchericon-512-512.png`
   - Or upload a higher resolution PNG/SVG if available

3. **Configure Settings**:
   - **Icon Type**: Adaptive Icon (Recommended)
   - **Shape**: Circle/Square (your preference)
   - **Background**: Choose solid color or transparent
   - **Padding**: Adjust if needed (usually 10-20%)

4. **Download**:
   - Click "Download" 
   - Select "Android (res folder)"
   - Extract the ZIP file

5. **Copy Files**:
   - Copy all `mipmap-*` folders from the ZIP
   - Paste into: `android/app/src/main/res/`
   - Overwrite existing files

### **Alternative: Android Asset Studio**

1. **Visit**: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html

2. **Upload your icon**:
   - Source: Image
   - Upload: `public/icons/android/android-launchericon-512-512.png`

3. **Configure**:
   - Name: `ic_launcher`
   - Foreground: Yes (select your icon)
   - Background: Choose color (#667eea for brand color or white)
   - Shape: Circle/Square
   - Effect: None (for clean look)

4. **Download & Install**:
   - Download ZIP
   - Extract and copy `res/` contents to `android/app/src/main/res/`

## After Icon Update

```bash
# Sync Capacitor
npx cap sync android

# Clean and rebuild
cd android
.\gradlew clean
.\gradlew assembleDebug

# Or open in Android Studio
```

## For Best Results

**Source Icon Requirements:**
- **Size**: Minimum 1024x1024px (higher is better)
- **Format**: PNG with transparency or SVG
- **Quality**: High resolution, crisp edges
- **Design**: Keep important elements centered (safe zone 80%)

**If you have a vector/SVG file, use that instead for best quality!**
