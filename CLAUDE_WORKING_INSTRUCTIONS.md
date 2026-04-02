# 🤖 Claude Working Instructions & App Analysis

**Last Updated:** April 1, 2026  
**Project:** ResetDopa™ - 30-Day Digital Wellness App  
**Tech Stack:** React Native + Expo + Firebase

---

## 📋 WORKING INSTRUCTIONS (MANDATORY)

### 1. **Collaboration Model**
- **Claude (Me):** Coding tasks, implementation, debugging, technical execution
- **Gemini:** Strategic thinking, ideation, high-level planning ("mind")
- I acknowledge and understand this dual-collaborator workflow

### 2. **Reporting Protocol**
- **BEFORE every task:** TL;DR summary of what I'm about to do
- **AFTER every task:** TL;DR summary of what was completed
- Format: Concise, bullet-point style

### 3. **Task Execution Standards**
- When given multiple tasks/instructions:
  - Execute them in order
  - Report separately for EACH task
  - **Format per task:**
    - ✅ **Done:** [what was completed]
    - ⏳ **Left:** [what remains, if any]

### 4. **Security Requirements**
- ❌ NEVER expose environment variables
- ❌ NEVER commit API keys
- ❌ NEVER hardcode secrets
- ✅ Always use `.env` files (excluded from git)
- ✅ Use Firebase security rules properly

### 5. **Security Scanning**
- Continuously monitor for vulnerabilities
- Report immediately if found:
  - 🔴 **Vulnerability:** [description]
  - 💡 **Suggestion:** [fix recommendation]

### 6. **All Communication**
- Keep reporting in **TL;DR format**
- Be concise, clear, actionable

---

## 📱 RESETDOPA™ APP ANALYSIS

### **Core Purpose**
30-day dopamine reset program to break addictive behaviors (pornography, excessive device use) through:
- Daily personalized habit tasks
- Streak tracking with grace periods
- Urge logging & pattern analysis
- Gamification (badges, calm points)
- AI companion chat (DopaGuide)

---

## 🏗️ ARCHITECTURE OVERVIEW

### **Tech Stack**
- **Framework:** React Native + Expo
- **Backend:** Firebase (Auth + Firestore)
- **State:** 7 Context Providers
- **Language:** JavaScript + TypeScript
- **Testing:** Jest (471 tests passing)
- **Navigation:** Stack + Bottom Tab Navigator (6 tabs)

### **Entry Points**
1. `index.js` → Registers root component
2. `App.tsx` → Main app with:
   - Error boundary
   - Font loading
   - 7 context providers
   - Navigation setup

### **Directory Structure**
```
src/
├── components/       # 20+ reusable UI (BreathingBall, FireworksOverlay, etc.)
├── config/          # Firebase configuration
├── constants/       # Task bundles, mood pools, schemas
├── context/         # 7 state providers (App, Auth, Program, Urges, Badges, Settings, Theme)
├── hooks/           # Custom hooks
├── screens/         # 17 screens (Dashboard, Program, UrgeLogger, etc.)
├── services/        # Firestore, Auth, Ollama services
├── types/           # TypeScript type definitions
└── utils/           # Helpers (streak calc, task gen, notifications)
```

### **7 Context Providers (Nested Order)**
1. **ThemeProvider** → Dark/light mode
2. **AuthProvider** → Firebase auth state
3. **ProgramProvider** → Streak/days/tasks
4. **UrgesProvider** → Urge logging
5. **BadgesProvider** → Achievements + points
6. **SettingsProvider** → App preferences
7. **AppProvider** → Master context (integrates all)

---

## ⚡ KEY FEATURES

### **1. 30-Day Program Structure**
- **Week 1 (Days 1-7):** 5 anchor tasks, 50% threshold
- **Week 2 (Days 8-14):** 6 tasks, 60% threshold
- **Week 3 (Days 15-21):** 6 tasks, 65% threshold
- **Week 4 (Days 22-30):** 6 tasks, 70% threshold
- **Day 30+:** Maintenance mode with rotating protocols

### **2. Smart Streak System**
- **Grace System:** Max 2 grace uses per rolling 7-day window
- **Day 2 Leniency:** Days 1-2 pass if ≥1 task completed
- **Optimistic UI:** Shows +1 when threshold met (before next day evaluation)
- **Milestones:** Days 3, 7 (🎆), 14, 21, 30 (🎆), 90
- **Fireworks:** Days 7 & 30 celebrations

### **3. Task System (7 Categories)**
- 🌅 **Morning:** Sunlight, bed-making, water, intentions
- 💪 **Physical:** Walking, push-ups, stretching, yoga
- 🎯 **Focus:** Pomodoro, reading, phone removal
- 🧠 **Mind:** Meditation, gratitude, journaling
- 🎧 **Detox:** No-phone blocks, app deletion
- 🎁 **Identity:** Affirmations, win tracking
- 👥 **Social:** Friend calls, compliments, helping

**Task Generation:**
- Week 1: Fixed 5 anchors + 2 dynamic
- Week 2+: Fixed anchors + 3 dynamic
- Mood-based pools (good/ok/bad)
- Time-of-day context (morning/afternoon/evening)
- AI-selected (if Ollama available) or random

**Task Properties:**
- Duration (e.g., "5 min breathwork")
- Points (2-10 based on difficulty)
- Category + friction level
- Science explanation

### **4. Gamification & Rewards**
**Calm Points:** 2-10 per task completion

**14 Badges (5 categories):**
1. **Starter:** First Day 🌱
2. **Streaks:** 3/7/30/90 days (🔥⭐🏆👑)
3. **Tasks:** 10/50/100 completions (✅💪🚀)
4. **Points:** 100/500/1000 calm (🌟💎🎯)
5. **Resistance:** 10/50 urges logged (🛡️⚔️)

**Notifications:**
- Badge unlock toasts
- Push notifications scheduled
- Milestone reminders (Days 8, 15, 22 at 8 AM)

### **5. Urge Logging**
**Schema:**
```javascript
{
  id: uuid,
  timestamp: Date.now(),
  intensity: 'low' | 'medium' | 'high',
  trigger: string,
  note: string (required),
  emotion: string,
  outcome: 'resisted' | 'indulged'
}
```

**Replacement Suggestions:**
- **High:** Cold water, 10 push-ups, 2-min breathing
- **Medium:** Walk, drink water, 5 push-ups
- **Low:** 5 deep breaths, stretch, gaze out window

### **6. Onboarding Flow**
1. **Legal Acceptance:** Terms + privacy policy
2. **Diagnostic Quiz:** 2 questions (pain point + available time)
3. **Bundle Selection:** Choose from 6 pre-curated bundles
4. **Immediate Win:** First task guidance
5. **Product Tour:** Optional 7-step walkthrough

**6 Pre-Curated Bundles:**
- Clarity Starter
- Digital Detox
- Calm & Ground
- Connection Rebuild
- Morning Momentum
- Focus Builder

### **7. Guides & Exercises**
**Breathing Guide:**
- 4 phases: Inhale (4s) → Hold (2s) → Exhale (4s) → Pause (2s)
- Animated BreathingBall component
- Text-to-speech instructions
- Loops continuously

**Meditation:** 5/10/15-minute options

**Stretching:** Interactive carousel (neck rolls, shoulder shrugs, spine twists, leg stretches)

**Timer Modal:**
- Parse task duration
- Start/pause/complete UI
- Confetti on completion

---

## 💾 DATA LAYER

### **Firebase Setup**
```javascript
Project: "dopareset" (Google Cloud)
Auth: Email/password + AsyncStorage persistence
Firestore: Real-time document database
Messaging: Push notifications (Expo-based)
```

**Platform-Specific Persistence:**
- **Web:** `browserLocalPersistence` (localStorage)
- **React Native:** `AsyncStorage` via `getReactNativePersistence()`

### **Firestore Document Structure**
**Collection:** `users/{uid}`
```javascript
{
  // Auth
  email, uid,
  
  // Profile
  username, avatar (1-8), goal, onboardingCompleted,
  diagnosticAnswers: {q1, q2},
  recommendedBundleId,
  
  // Program Data
  startDate, startDateResets, streak,
  todayPicks: {[day]: string[]},
  todayCompletions: {[day]: {[task]: boolean}},
  dailyMetrics: {[day]: DailyMetrics},
  
  // Streak Tracking
  graceUsages: [{usedOnDay, expiresOnDay}],
  lastStreakDayCounted, streakEvaluatedForDay,
  thresholdMetToday, week1SetupDone,
  week1Anchors, week1RotationApplied, week1Completed,
  
  // UI State
  lastMoodCheckTime, currentMood: 'good'|'ok'|'bad',
  
  // Urges
  urges: [{...}],
  
  // Badges & Points
  badges: [{id, title, got}],
  calmPoints,
  
  // Settings
  completedWeeksWithFireworks: number[],
  hasAcceptedTerms, termsAcceptedAt,
  
  // Timestamps
  createdAt, updatedAt
}
```

### **AsyncStorage Keys**
- `username`, `avatar`, `goal` → Profile
- `themePreference` → 'dark'|'light'|null
- `notificationsEnabled` → boolean
- `moodEnabled`, `moodHour`, `moodMinute` → Reminders
- `seen_intro_*` → Intro overlays
- `guideSeen_v2` → Tour completion
- `@dopaguide_chat_history` → Chat messages (max 100)

### **BatchSaveManager** (Optimized Writes)
**Purpose:** Debounce & batch Firestore updates to reduce write costs

```typescript
class BatchSaveManager {
  queueUpdates(updates) → Merges + debounces writes
  destroy() → Cleanup & final flush
}
```

**Used by:** ProgramContext, BadgesContext, UrgesContext, SettingsContext

---

## 🎨 UI/UX PATTERNS

### **Theme System**
- **ThemeContext** with `useTheme()` hook
- Colors: `text`, `background`, `surfacePrimary`, `surfaceSecondary`, `accent`, `error`
- Dark mode compatible throughout
- **Standard:** Always use theme colors, never hardcoded colors

### **Safe Area Handling**
- Status bar height handling
- Notch/home indicator awareness
- KeyboardAvoidingView for inputs
- Platform-specific adjustments

### **Animations**
- BreathingBall (breathing guide)
- FireworksOverlay (milestone celebrations)
- ConfettiAnimation (task completion)
- StreakNumber (animated counter)
- All animations cleaned up on unmount

### **Platform Differences**
- iOS vs Android keyboard behavior
- Safe area insets
- Status bar styling
- Haptics (fail gracefully on simulators)

---

## 🧪 TESTING SETUP

### **Current Status**
- **471/471 tests passing** ✅
- Framework: Jest
- Config: `jest.config.js`, `jest.setup.js`

### **Test Coverage Areas**
- Streak calculations (`streakCalculations.js`)
- Task generation (`taskGenerator.js`)
- Grace system logic
- Badge unlock conditions
- Context providers

### **Testing Standards**
- All new code must be testable
- No test regressions allowed
- Run `npm test` before committing
- Maintain 471/471 passing status

---

## 🔒 SECURITY CONSIDERATIONS

### **Current Security Posture**

✅ **Good Practices:**
- Firebase Auth with email/password
- Firestore security rules (assumed configured)
- AsyncStorage for sensitive data (local only)
- No hardcoded credentials in tracked files

⚠️ **Potential Vulnerabilities to Monitor:**

1. **Firebase Config Exposure**
   - **Risk:** Firebase config in `src/config/firebase.js` may contain API keys
   - **Status:** Needs verification (not exposed if using env variables)
   - **Recommendation:** Ensure firebase config uses `.env` file

2. **Firestore Security Rules**
   - **Risk:** Rules may not be restrictive enough
   - **Status:** Rules exist in `firestore.rules` but need audit
   - **Recommendation:** Verify users can only read/write their own data

3. **AsyncStorage Sensitive Data**
   - **Risk:** Local storage is not encrypted on device
   - **Status:** Using AsyncStorage for profile/settings
   - **Recommendation:** Acceptable for current data, but don't store passwords/tokens

4. **Ollama API (Local AI)**
   - **Risk:** Local endpoint might be exposed in code
   - **Status:** Optional feature, needs verification
   - **Recommendation:** Ensure no API keys hardcoded

5. **Push Notification Tokens**
   - **Risk:** Expo push tokens stored in Firestore
   - **Status:** Standard practice for notifications
   - **Recommendation:** Ensure tokens are user-specific

### **Security Audit Checklist**
- [ ] Verify `.env` file exists and is in `.gitignore`
- [ ] Audit `firestore.rules` for proper user isolation
- [ ] Check `firebase.js` for hardcoded keys
- [ ] Verify no API keys in tracked files
- [ ] Review AsyncStorage usage (no passwords/tokens)
- [ ] Confirm Expo push token handling is secure

---

## 🛠️ IMPLEMENTATION STANDARDS

### **Code Quality Rules**
1. **TypeScript:** Use proper types, avoid `any`
2. **Error Handling:** Wrap all async in try-catch
3. **Null Safety:** Always check null/undefined
4. **Single Responsibility:** One function = one purpose
5. **Comments:** Explain "why", not "what"

### **React Native Standards**
1. **Safe Areas:** Always account for notches/status bars
2. **Keyboard:** Use KeyboardAvoidingView for inputs
3. **Platform Differences:** Test iOS AND Android
4. **Memory:** Cleanup animations/timers on unmount
5. **Dark Mode:** Use ThemeContext colors always

### **Commit Standards**
- Format: Single-line, imperative tense
- Example: `Add animated stretch visualizations`
- ❌ NO multi-line commits
- ❌ NO Co-Authored-By footer

### **Before Submitting Code**
- [ ] No external URLs that can fail
- [ ] Dark mode compatible
- [ ] Safe area aware
- [ ] Keyboard safe
- [ ] Memory efficient (cleanup)
- [ ] All 471 tests passing
- [ ] Single-line commit message
- [ ] Error handling for async ops
- [ ] Graceful fallbacks

---

## 📊 CURRENT PROJECT STATUS

### **Production Readiness**
- ✅ Core features complete
- ✅ All tests passing (471/471)
- ✅ Dark mode implemented
- ✅ Onboarding flow complete
- ✅ Streak system with grace periods
- ✅ Task guides (breathwork, meditation, stretching)
- ✅ Badge system functional
- ✅ Urge logging implemented

### **Known Edge Cases Handled**
1. ✅ Memory leaks on unmount (animations cleaned up)
2. ✅ Android keyboard overlap (KeyboardAvoidingView used)
3. ✅ Haptic feedback (fails gracefully on simulators)
4. ✅ Audio/TTS (try-catch with fallbacks)
5. ✅ Firestore write optimization (BatchSaveManager)
6. ✅ Optimistic UI (display streak +1 when threshold met)
7. ✅ Grace system (rolling 7-day window)
8. ✅ Overnight rollover (handled in streak calculations)

---

## 🚀 WHAT I CAN HELP WITH

1. **Bug Fixes** (thorough edge-case analysis)
2. **New Features** (following existing patterns)
3. **Performance Optimization** (memory, animations, Firestore)
4. **Testing** (maintaining 471/471 coverage)
5. **UI Enhancements** (dark mode, safe areas, platform consistency)
6. **Refactoring** (maintaining architecture standards)
7. **Security Audits** (vulnerability scanning)
8. **Documentation** (code comments, guides)

---

## 📝 NOTES FOR FUTURE DEVELOPMENT

### **Architecture Decisions**
- **Why 7 Contexts?** Separation of concerns, each handles specific domain
- **Why BatchSaveManager?** Reduce Firestore write costs (debouncing)
- **Why Grace System?** User retention, reduce frustration from missed days
- **Why Optimistic UI?** Better UX, immediate feedback

### **Technical Debt to Monitor**
- Ollama integration (optional, may need better error handling)
- Firebase config (ensure env variables used)
- Test coverage (maintain as features added)
- Performance (monitor as user base grows)

---

## ✅ CONFIRMATION

**I understand and will follow:**
1. ✅ Dual-collaborator model (Claude for coding, Gemini for strategy)
2. ✅ TL;DR reporting before & after every task
3. ✅ Separate reporting per task (done/left)
4. ✅ Never expose env variables or API keys
5. ✅ Continuous security scanning & reporting
6. ✅ All communication in TL;DR format

**Ready to execute tasks with these standards!** 🚀

---

*End of Document*
