# How to View Console Logs in Expo

## Your console logs can be in different places depending on your setup:

### Option 1: Terminal where you ran `npm start`
- **Default location** - Logs should show here
- Look for yellow or red text
- Scroll up to see older logs
- If you see nothing, try the other options below

### Option 2: Expo Dev Tools (Browser)
1. When you run `npm start`, it opens a browser tab
2. URL is usually: `http://localhost:19002` or `http://localhost:8081`
3. Click on "Terminal" tab at the bottom
4. All logs show here in real-time

### Option 3: Android Emulator Logs (logcat)
**Method A: Via Android Studio**
1. Open Android Studio
2. Bottom toolbar: click "Logcat"
3. Filter by "ReactNativeJS" to see only JS logs

**Method B: Via Command Line**
```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

**Method C: Via npx**
```bash
npx react-native log-android
```

### Option 4: React Native Debugger
1. In the app, shake the device/emulator
2. Press "Debug"
3. Opens Chrome DevTools
4. Go to Console tab

### Option 5: Expo Go App (if using)
- Logs show in the Expo Go app itself
- Shake device
- Tap "Show Developer Menu"
- Tap "Show Performance Monitor"

## Quick Test
Run this command in a NEW terminal (keep npm start running):
```bash
adb logcat | grep -i "Settings\|Theme\|Toggle"
```

This will filter only theme-related logs.

## What You Should See
When you open Settings screen, you should see:
```
⚙️ Settings rendered. isDarkMode: false colors: [Object object]
⚙️ Settings MOUNTED
```

When you tap toggle:
```
⚙️ Settings: Toggle button pressed
🌙 Toggle theme called. Current isDarkMode: false
🌙 Setting to: dark
🌙 Theme saved to AsyncStorage
```

## If You See NOTHING
This means:
1. Logs are disabled or filtered out
2. App crashed before rendering Settings
3. Emulator not properly connected
4. LogBox is suppressing console.log

Try: Press `j` in the terminal where npm start is running (opens debugger)