# Collaboration Guidelines

## Team Structure
- **GitHub Copilot CLI**: Coding collaborator
- **Gemini**: Mind/strategy collaborator
- Working together on ResetDopa mobile app

## Version Information (Knowledge Transfer)

### Current App Version
- **Version**: 1.0.0
- **Android versionCode**: 13
- **iOS buildNumber**: 1.0.0
- **⚠️ IMPORTANT**: Increment `android.versionCode` before EVERY production build for Play Store

### Core Dependencies (Locked Versions)
```
React Native: 0.72.6
React: 18.2.0
Expo SDK: ~54.0.0
Firebase: 10.12.0
```

### Navigation Stack
```
@react-navigation/native: 6.1.17
@react-navigation/native-stack: 6.9.26
@react-navigation/bottom-tabs: 6.5.20
```

### Key Expo Modules
```
expo-notifications: 0.32.16
expo-updates: 29.0.16
expo-font: 14.0.11
expo-linear-gradient: 15.0.8
expo-build-properties: 1.0.10
```

### Animation & UI
```
lottie-react-native: 7.3.5
react-native-svg: 15.12.1
react-native-confetti-cannon: 1.5.2
react-native-worklets: 0.5.1
```

### Android Build Config
```
compileSdkVersion: 35
targetSdkVersion: 35
minSdkVersion: 24
kotlinVersion: 2.0.21
```

### iOS Build Config
```
deploymentTarget: 15.1
```

### Pre-Production Build Checklist
- [ ] Increment `android.versionCode` in app.json
- [ ] Update `version` if major/minor changes
- [ ] Run all 471 tests (`npm test`)
- [ ] Security scan (no exposed keys/env vars)
- [ ] Test on physical Android device
- [ ] Test on physical iOS device
- [ ] Verify dark mode on both platforms

## Mandatory Workflow Rules

### 1. Reporting Protocol
- **Always provide TL;DR** before starting any task
- **Always provide TL;DR** after completing any task
- Format: Brief, actionable summary (2-3 lines max)

### 2. Task Execution
- When given multiple instructions, **report separately** for each task:
  - ✅ What is done
  - ⏳ What is left
- Never assume completion without verification

### 3. Security Requirements
- **Never expose**:
  - Environment variables
  - API keys
  - Secrets or credentials
  - Firebase config in public files
- **Always scan** for security vulnerabilities
- **Report immediately** if vulnerabilities detected
- Provide actionable security suggestions

### 4. File Creation Policy
- **Do NOT create** unnecessary text/markdown files
- **Exception**: Only when explicitly requested
- Keep workspace clean and focused

### 5. Code Quality Standards
- All changes must pass existing tests (471/471)
- Maintain TypeScript type safety
- Follow React Native best practices
- Test on both iOS and Android (safe areas, keyboard, lifecycle)
- Implement dark mode support using ThemeContext

### 6. Commit Standards
- Single-line imperative messages
- No Co-Authored-By footer
- Example: `Add breathwork guide with auto-advance`

## Security Checklist (Run Before Every Commit)
- [ ] No hardcoded API keys
- [ ] No exposed environment variables
- [ ] Firebase config properly secured
- [ ] User data properly sanitized
- [ ] All async operations have error handling
- [ ] No memory leaks (cleanup timers/listeners)

## Current Project Status
- Framework: React Native + Expo
- Tests: 471 passing
- Features: Breathwork, meditation, stretching guides
- Theme: Light/Dark mode with ThemeContext

---

**Last Updated**: 2026-04-05
**Status**: Active
