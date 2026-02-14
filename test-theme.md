# Theme Toggle Debug Checklist

## Console Output to Look For:

### When Settings screen loads:
```
⚙️ Settings rendered. isDarkMode: <true/false> colors: {background: '#...', ...}
```

### When you tap the toggle:
```
⚙️ Settings: Toggle button pressed
🌙 Toggle theme called. Current isDarkMode: <true/false>
🌙 Setting to: <dark/light>
🌙 Theme saved to AsyncStorage
```

### If it fails:
```
❌ Failed to save theme preference: <error message>
```

## What to Report Back:

1. [ ] Did you see "Settings rendered" log?
2. [ ] Did you see "Toggle button pressed" when you tapped?
3. [ ] Did you see "Toggle theme called"?
4. [ ] Did you see "Theme saved to AsyncStorage"?
5. [ ] Did the screen colors change?
6. [ ] Did the switch physically move?
7. [ ] Any red errors in console?
8. [ ] Any yellow warnings in console?

## Expected Behavior:

When you toggle:
- Switch should flip position immediately
- Background should change from white → dark blue-black (#0F172A)
- Text should change from dark → light
- Section titles should become light colored
- Cards should become dark slate (#1E293B)
- Moon icon should appear (instead of sun)
- Status text should say "Dark theme enabled"

If NONE of these happen, the toggle isn't working.
If SOME happen but not all, partial theme application.
