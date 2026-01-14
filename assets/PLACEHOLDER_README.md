# Asset Placeholders

These are placeholder files. You need to replace them with actual assets before launching.

## Required Assets:

1. **icon.png** (1024x1024px)
   - App icon for iOS and Android
   - Should be your app's logo
   - No transparency, solid background recommended

2. **adaptive-icon.png** (1024x1024px)
   - Android adaptive icon foreground
   - Can have transparency
   - Center 66% is safe zone

3. **splash.png** (1242x2436px for iPhone X)
   - Launch screen image
   - Center content in safe zone
   - Background color set in app.json

4. **notification-icon.png** (96x96px)
   - White icon with transparency
   - Used in Android notification tray
   - Simple, recognizable shape

5. **favicon.png** (32x32px)
   - Web version only
   - Small version of your logo

## Tools for Creating Assets:

- **Figma** (free) - Design all assets
- **Sketch** (Mac only) - Professional design tool
- **Canva** (free) - Quick mockups
- **Adobe Express** (free) - Icon generator

## Asset Generation Services:

- **MakeAppIcon.com** - Generate all sizes from one image
- **AppIcon.co** - iOS and Android icons
- **Expo Icon Tool** - `npx expo-optimize` (after creating icon.png)

## Quick Start:

For development/testing, you can use solid color placeholders:
- Create 1024x1024 PNG with your brand color
- Add text overlay with app name
- Save as icon.png

The current files are tiny 1x1 placeholders just to prevent build errors.
