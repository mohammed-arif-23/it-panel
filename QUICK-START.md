# ⚡ Quick Start - PWA Installation

## 🚀 Get Your PWA Running in 3 Steps

### Step 1: Install Package (1 minute)
```bash
npm install next-pwa
```

### Step 2: Generate Icons (5 minutes)

**Option A - Online Tool (Easiest):**
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your logo (512x512 px or larger)
3. Download icons
4. Extract to `public/icons/` folder

**Option B - Automatic Script:**
```bash
# Place logo as public/logo-source.png
npm install sharp
node scripts/generate-icons.js
```

### Step 3: Build & Run (2 minutes)
```bash
npm run build
npm start
```

Visit `http://localhost:3000` and look for the install icon in your browser!

---

## 🧪 Quick Test

1. Open Chrome DevTools (F12)
2. Go to Application tab
3. Check "Manifest" - should show app details
4. Check "Service Workers" - should be registered
5. Click install icon in address bar
6. App installs to desktop/home screen! 🎉

---

## 🚀 Deploy to Production

```bash
# Build and deploy
npm run build
git add .
git commit -m "Add PWA support"
git push

# Vercel will auto-deploy
# Or: vercel --prod
```

That's it! Your app is now a PWA! 📱
