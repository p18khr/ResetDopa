# 🔗 Landing Page Integration Guide

## Overview
How to integrate the brutalist landing page with your existing ResetDopa React Native Expo app.

---

## 🎯 **TWO DEPLOYMENT OPTIONS**

### **Option 1: Separate Web Landing (Recommended)**
Deploy landing page as standalone website, link to app download.

**Pros:**
- ✅ Clean separation of concerns
- ✅ Faster web performance
- ✅ Easier to update independently
- ✅ Better SEO (pure web app)

**Setup:**
1. Create separate repository for landing page
2. Deploy to Vercel/Netlify
3. Point domain (resetdopa.com) to landing
4. Link CTA buttons to app stores

### **Option 2: Expo Web Build**
Include landing page in Expo web build.

**Pros:**
- ✅ Single codebase
- ✅ Shared components possible
- ✅ Consistent branding

**Setup:**
1. Add landing page to Expo app
2. Create web-only route
3. Build with `expo build:web`
4. Deploy dist folder

---

## 🚀 **RECOMMENDED ARCHITECTURE**

```
ResetDopa Ecosystem
├── resetdopa.com (Web Landing - THIS)
│   ├── Hero + Features
│   ├── CTA → App Store/Play Store
│   └── Static hosting (Vercel/Netlify)
│
├── app.resetdopa.com (Expo Web Build - OPTIONAL)
│   └── Full app experience in browser
│
└── Mobile Apps
    ├── iOS (App Store)
    └── Android (Play Store)
```

---

## 📱 **CONNECTING LANDING TO MOBILE APP**

### **CTA Button Links**

**Replace button `onClick` handlers:**

```javascript
// START PROTOCOL button
<button 
  onClick={() => {
    // Detect platform and redirect
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/android/i.test(userAgent)) {
      // Redirect to Play Store
      window.location.href = 'https://play.google.com/store/apps/details?id=com.resetdopa.app';
    } else if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      // Redirect to App Store
      window.location.href = 'https://apps.apple.com/app/resetdopa/idXXXXXXXXX';
    } else {
      // Fallback to web version
      window.location.href = 'https://app.resetdopa.com';
    }
  }}
  className="group relative bg-[#00FF41]..."
>
  START PROTOCOL
</button>
```

### **Smart Deep Linking**

**Add universal links for seamless app opening:**

```javascript
// If app is installed, open app. Otherwise, go to store.
<a 
  href="resetdopa://protocol/start"
  onClick={(e) => {
    e.preventDefault();
    
    // Try to open app
    window.location.href = 'resetdopa://protocol/start';
    
    // If app not installed, redirect to store after delay
    setTimeout(() => {
      const userAgent = navigator.userAgent;
      if (/android/i.test(userAgent)) {
        window.location.href = 'https://play.google.com/store/...';
      } else {
        window.location.href = 'https://apps.apple.com/...';
      }
    }, 1500);
  }}
>
  START PROTOCOL
</a>
```

---

## 🌐 **DEPLOYMENT: SEPARATE WEB APP (RECOMMENDED)**

### **Step 1: Create New React Project**

```bash
# Create new React app
npx create-react-app resetdopa-landing
cd resetdopa-landing

# Install dependencies
npm install tailwindcss postcss autoprefixer lucide-react
npx tailwindcss init -p
```

### **Step 2: Copy Files**

```bash
# Copy the landing page component
cp ../dopaReset1/src/components/LandingPage.jsx src/

# Copy Tailwind config
cp ../dopaReset1/tailwind.config.example.js tailwind.config.js
```

### **Step 3: Setup App.js**

```javascript
import React from 'react';
import LandingPage from './LandingPage';
import './index.css';

function App() {
  return <LandingPage />;
}

export default App;
```

### **Step 4: Setup index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=JetBrains+Mono:wght@400;500;700&display=swap');

body {
  margin: 0;
  font-family: 'JetBrains Mono', monospace;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #000000;
  color: #ffffff;
  overscroll-behavior: none; /* Prevent iOS bounce */
}

* {
  box-sizing: border-box;
}
```

### **Step 5: Deploy to Vercel**

```bash
# Build
npm run build

# Deploy (one command!)
npx vercel
```

**Or use Vercel GitHub integration:**
1. Push to GitHub
2. Connect repo to Vercel
3. Auto-deploys on push

---

## 🔗 **EXPO WEB INTEGRATION (ALTERNATIVE)**

### **Step 1: Add Web Support to Expo**

```bash
# Already included in Expo by default
npx expo install react-dom react-native-web
```

### **Step 2: Add Landing Route**

Create `src/screens/LandingWeb.jsx`:

```javascript
import React from 'react';
import { Platform } from 'react-native';
import LandingPage from '../components/LandingPage';

export default function LandingWeb() {
  // Only render on web
  if (Platform.OS !== 'web') {
    return null;
  }
  
  return <LandingPage />;
}
```

### **Step 3: Add to Navigation**

```javascript
// In App.tsx or navigation setup
import { Platform } from 'react-native';
import LandingWeb from './src/screens/LandingWeb';

// Add conditional route
{Platform.OS === 'web' && (
  <Stack.Screen 
    name="Landing" 
    component={LandingWeb}
    options={{ headerShown: false }}
  />
)}
```

### **Step 4: Build Web Version**

```bash
# Build for web
npx expo export --platform web

# Deploy dist folder
# Upload to Firebase Hosting, Netlify, etc.
```

---

## 📊 **SEO OPTIMIZATION**

### **Add Meta Tags**

**In `public/index.html`:**

```html
<head>
  <!-- Primary Meta Tags -->
  <title>ResetDopa™ | 30-Day Dopamine Reset Protocol</title>
  <meta name="title" content="ResetDopa™ | 30-Day Dopamine Reset Protocol">
  <meta name="description" content="Systematic neurochemical recalibration. 30 days. Zero negotiation. Built for operators who execute.">

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://resetdopa.com/">
  <meta property="og:title" content="ResetDopa™ | 30-Day Dopamine Reset Protocol">
  <meta property="og:description" content="Systematic neurochemical recalibration. 30 days. Zero negotiation.">
  <meta property="og:image" content="https://resetdopa.com/og-image.png">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://resetdopa.com/">
  <meta property="twitter:title" content="ResetDopa™ | 30-Day Dopamine Reset Protocol">
  <meta property="twitter:description" content="Systematic neurochemical recalibration. 30 days. Zero negotiation.">
  <meta property="twitter:image" content="https://resetdopa.com/og-image.png">

  <!-- Theme Color -->
  <meta name="theme-color" content="#000000">
  <meta name="msapplication-TileColor" content="#000000">
</head>
```

### **Add Structured Data**

```javascript
// Add to LandingPage.jsx
<script type="application/ld+json">
{`
  {
    "@context": "https://schema.org",
    "@type": "MobileApplication",
    "name": "ResetDopa",
    "operatingSystem": "iOS, Android",
    "applicationCategory": "HealthApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  }
`}
</script>
```

---

## 🎨 **BRAND CONSISTENCY**

### **Share Assets Between Landing & App**

**Colors:**
- Landing: `#00FF41` (Matrix Green)
- App: Use same green in theme context

**Typography:**
- Landing: Playfair Display + JetBrains Mono
- App: Can keep native fonts (performance)

**Messaging:**
- Consistent "Disciplined Performance Protocol" tone
- Use same copy style (command-line, brutalist)

---

## ⚡ **PERFORMANCE TIPS**

### **1. Optimize Images**

```bash
# If you add images later
npm install sharp
# Use next-gen formats (WebP, AVIF)
```

### **2. Lazy Load Below Fold**

```javascript
import { lazy, Suspense } from 'react';

const FeaturesSection = lazy(() => import('./FeaturesSection'));

<Suspense fallback={<div>Loading...</div>}>
  <FeaturesSection />
</Suspense>
```

### **3. Preload Fonts**

```html
<link rel="preload" as="font" href="/fonts/playfair-display.woff2" crossorigin>
<link rel="preload" as="font" href="/fonts/jetbrains-mono.woff2" crossorigin>
```

### **4. Code Splitting**

```javascript
// Already handled by Create React App
// Or use dynamic imports
const Analytics = await import('./analytics');
```

---

## 🐛 **TROUBLESHOOTING**

### **Fonts Not Loading**

```css
/* Ensure fonts are loaded before rendering */
document.fonts.ready.then(() => {
  document.body.classList.add('fonts-loaded');
});
```

### **Tailwind Classes Not Working**

```javascript
// Check tailwind.config.js content paths
content: [
  "./src/**/*.{js,jsx,ts,tsx}", // ✅ Correct
  "./components/**/*.jsx",       // ❌ Wrong if not in root
]
```

### **Animation Stutter on Mobile**

```css
/* Add hardware acceleration */
.ekg-line {
  will-change: transform;
  transform: translateZ(0);
}
```

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Landing page builds without errors
- [ ] All fonts loading correctly
- [ ] CTA buttons link to correct URLs
- [ ] Mobile responsive (test 320px+)
- [ ] Cross-browser tested (Chrome, Safari, Firefox)
- [ ] Lighthouse score >90
- [ ] Meta tags added for SEO
- [ ] Analytics integrated
- [ ] Domain pointed correctly
- [ ] SSL certificate active
- [ ] Error tracking setup (Sentry)

---

## 📞 **NEXT STEPS**

1. ✅ **Deploy landing page** (Vercel/Netlify)
2. ✅ **Publish mobile app** (App Store/Play Store)
3. ✅ **Connect CTAs** to app download links
4. ✅ **Add analytics** to track conversions
5. ✅ **A/B test** different copy variations
6. ✅ **Monitor performance** (Lighthouse CI)

---

*Landing page is production-ready. Deploy with confidence.* 🚀
