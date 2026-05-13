# App Blocker Fixes - Session 3

## Issues Fixed

### 1. **Lock Screen Issue ✅**
**Problem:** When user locked phone, blocker disappeared and didn't reappear on unlock.

**Root Cause:** `onPause()` was calling `finish()` when phone locked, destroying the overlay activity.

**Fixes Applied:**
- Added window flags in `onCreate()`:
  - `FLAG_KEEP_SCREEN_ON` - Prevents screen from turning off
  - `FLAG_SHOW_WHEN_LOCKED` - Shows overlay on lock screen
  - `FLAG_TURN_SCREEN_ON` - Wakes screen when blocker appears
  - `FLAG_DISMISS_KEYGUARD` - Can dismiss lockscreen
- Added `android.permission.DISABLE_KEYGUARD` to manifest
- Modified `onPause()` to never finish the activity (blocker now stays visible across screen lock/unlock)

**Result:** Blocker now stays visible even when phone is locked. User must address it before resuming normal use.

---

### 2. **App Opens Then Gets Blocked Again ✅**
**Problem:** After breathing exercise, user clicks "Open App", app opens briefly, then blocker reappears.

**Root Cause:** AppMonitorService continued monitoring the app after it was opened, blocking it again immediately.

**Fixes Applied:**
- Added `temporarilyAllowedApps: MutableSet<String>` to AppMonitorService (session-only list)
- Modified `checkForegroundApp()` to skip apps in temporary allow list
- Modified `onStartCommand()` to handle `allow_temporarily_app` intent
- Modified `openBlockedApp()` in BlockOverlayActivity to send temporary allow signal

**Flow:**
1. User completes breathing exercise
2. User clicks "Open App"
3. BlockOverlayActivity sends `allow_temporarily_app` intent to AppMonitorService
4. Service adds app to `temporarilyAllowedApps` set (in-memory, session-based)
5. App opens without being re-blocked
6. AppMonitorService checks if app is in temporary list before blocking

**Result:** User can use the app for the rest of the session without being blocked again. Temporary allow list resets when app is restarted.

---

### 3. **Points Management Architecture ✅**
**Problem:** No checking if user has sufficient Calm Points; no tracking of points.

**Fixes Applied:**
Added new methods to `AppBlockerModule.kt`:

#### `recordBlockEvent(packageName: String)`
Records when an app is blocked for analytics:
```kotlin
// Tracks block count and last block time per app
// Can be called before showing blocker to deduct points
```

Usage:
```javascript
// From React Native side
await AppBlocker.recordBlockEvent(blockedPackage);
```

#### `temporarilyAllowApp(packageName: String)`
Explicitly allows an app temporarily (redundant with current flow but exposed for React side):
```kotlin
// Used if React side needs to allow an app programmatically
```

---

## Integration with React Native Points System

### Recommended Flow:
1. **Before showing blocker:**
   ```javascript
   // Check if user has sufficient points
   if (userBalance < 2) {
     // Show warning or require longer breathing exercise
     showRequireMoreBreathingScreen();
     return;
   }
   ```

2. **When blocker is shown (BlockOverlayActivity):**
   ```javascript
   // Record the block event (analytics)
   await AppBlocker.recordBlockEvent(blockedPackage);
   // Optionally deduct points immediately
   await deductCalmPoints(blockedPackage, 2);
   ```

3. **When user completes breathing (showPostSurvivalChoice):**
   ```javascript
   // Add points if they resisted
   await addCalmPoints(2);
   ```

4. **When user clicks "Open App":**
   ```javascript
   // Points already deducted, nothing needed
   // App is automatically temporarily allowed
   ```

---

## File Changes Summary

### `BlockOverlayActivity.kt`
- Added window flags to `onCreate()` for lock screen support
- Modified `onPause()` to never finish the activity
- Modified `openBlockedApp()` to send temporary allow intent
- Improved UI design with better colors and guidance text

### `AppMonitorService.kt`
- Added `temporarilyAllowedApps: MutableSet<String>` field
- Modified `checkForegroundApp()` to skip temporary apps
- Modified `onStartCommand()` to handle allow intent

### `AppBlockerModule.kt`
- Added `recordBlockEvent(packageName)` method
- Added `temporarilyAllowApp(packageName)` method

### `AndroidManifest.xml`
- Added `android.permission.DISABLE_KEYGUARD` permission

---

## Test Scenarios

### Scenario 1: Breathing Exercise + Open App
```
1. User opens blocked app → Blocker appears
2. User completes 60s breathing
3. User clicks "✓ I'm Good" → Goes back to app, app NOT blocked again ✅
4. User reopens blocked app → Blocker appears (new session) ✅
```

### Scenario 2: Lock Screen
```
1. Blocker is showing
2. User locks phone → Blocker still visible ✅
3. User unlocks phone → Blocker still there ✅
```

### Scenario 3: Multiple Apps in Session
```
1. Block Instagram → Complete exercise → Open it (temporary allow)
2. Open Twitter (not blocked yet) → Can use normally
3. Block Twitter → Complete exercise → Open it (temporary allow)
4. Both apps can be used for rest of session
5. Restart app → Both will be blocked again ✅
```

---

## Points System TODOs

These should be implemented in React Native side:

- [ ] Check user balance before showing blocker
- [ ] Deduct points when app is blocked
- [ ] Add points when user completes breathing
- [ ] Show point notifications in blocker UI
- [ ] Handle insufficient points scenario

