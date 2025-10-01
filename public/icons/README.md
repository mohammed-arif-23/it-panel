# PWA Icons Directory

This folder contains all the icons needed for your Progressive Web App.

## Required Icons

Your PWA needs the following icons:
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-144x144.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-384x384.png`
- `icon-512x512.png`
- `icon-maskable-192x192.png`
- `icon-maskable-512x512.png`

## How to Generate Icons

### Option 1: Automatic Generation (Recommended)
1. Place your logo as `public/logo-source.png` (512x512 or larger)
2. Install sharp: `npm install sharp`
3. Run: `node scripts/generate-icons.js`

### Option 2: Online Generator
1. Visit: https://www.pwabuilder.com/imageGenerator
2. Upload your logo (512x512 recommended)
3. Download and extract icons to this folder

### Option 3: Manual Creation
Use any image editing tool (Photoshop, GIMP, etc.) to resize your logo to the required sizes.

## Maskable Icons
Maskable icons have a safe zone to ensure the icon looks good on all Android devices with different shapes (circle, square, rounded square). Add 10% padding around your logo for maskable icons.

## Temporary Solution
If you don't have icons yet, the app will still work but won't have a proper icon when installed. Generate icons before deploying to production.
