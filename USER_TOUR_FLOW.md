# User Tour Flow & Onboarding System

## Overview
ResetDopa has a **multi-stage onboarding flow** that guides new users through the app's core concepts, then progressively reveals features as they progress through Day 1 and beyond.

---

## Flow Stages

### Stage 1: Legal Acceptance (Before Dashboard)
**Trigger**: On first login
**Component**: `LegalAcceptanceModal`
**What Happens**:
- User must scroll through both Terms and Privacy Policy
- Both tabs must be fully scrolled to bottom
- User taps "Accept & Continue"
- Sets `hasAcceptedTerms = true` in AppContext
- Redirects to Dashboard

**Gate**: App won't show Dashboard until terms accepted

---

### Stage 2: Product Tour (Visual Guide)
**Trigger**: On first login (after legal acceptance)
**Component**: `OnboardingTour`
**Visibility**: Modal overlay (unskippable, no close button)
**Duration**: ~7 screens/steps

**7-Step Tour Flow**:

| Step | Title | Icon | Content | Navigation | Visual |
|------|-------|------|---------|-----------|--------|
| 1 | Welcome | planet-outline | Intro to ResetDopa mission | Dashboard | App Logo |
| 2 | Calm Points | lightning-outline | How to earn points (5/7/10) | Dashboard | "+7 Points Earned" |
| 3 | Streaks Matter | flame-outline | Streak building & grace days | Dashboard | "🔥 5 Day Streak" |
| 4 | Task Domains | shapes-outline | 7 categories, difficulty levels | Dashboard | Task categories info |
| 5 | Your Program | calendar-outline | Complete daily targets | **Program Screen** | Task example |
| 6 | Log Urges | chatbubble-ellipses-outline | Track urges & outcomes | **UrgeLogger Screen** | Urge logging info |
| 7 | Milestones Ahead | trophy-outline | Fireworks 🎆, badges, 30-day journey | Dashboard | Lottie fireworks animation |

**User Actions**:
- Tap "Next >" to advance
- "Back <" to go to previous step
- Final step shows "Got It" button instead of Next
- **Cannot skip** - must complete all 7 steps

**Taps & Animations**:
- Each step advances through 350ms navigation delay (smooth transitions)
- Tour can run in two modes:
  1. **Visual Mode**: Shows overlay cards (first-time users)
  2. **Controller Mode**: Silent orchestration (subsequent sessions)

---

### Stage 3: Week 1 Anchor Selection (Day 1 Only)
**Trigger**: When user reaches Dashboard on Day 1 AND `week1SetupDone === false`
**Component**: Modal in Dashboard with task selection
**What Happens**:

1. **Modal Opens**: "Pick Your 5 Daily Anchors"
   - Shows all available tasks
   - User selects exactly 5 tasks
   - Confirm button enabled only when 5 selected

2. **Selection Logic**:
   - Tasks grouped by domain (Morning, Mind, Physical, Focus, Detox, Social, Creative)
   - Shows friction level (low/med/high)
   - Shows point value (5/7/10)
   - Visual: Check marks appear on selected tasks

3. **Confirmation**:
   - User taps "Let's Begin"
   - Sets `week1SetupDone = true`
   - Generates week 1 task picks (Days 1-7)
   - Stores anchors in context
   - Modal closes, reveals dashboard

**Timing**: Appears ~700ms after Dashboard loads (smooth UX)

---

### Stage 4: In-Context Guides (Days 1-7)

#### 4.1 Guide Flag System
Uses AsyncStorage flags to track progress:
- `guideNeedMarkOne` = true initially on Day 1
- `guideShowExplore` = true after first task marked
- `guideSeen_v2` = true when guide dismissed

#### 4.2 "Mark One Task" Inline Prompt (Day 1)
**Where**: Program screen
**Trigger**: When `guideNeedMarkOne === true`
**Shows**: Floating banner: "Try marking a task to see your points earned!"
**Dismisses**: When user marks any task for current day

#### 4.3 "Explore Other Tasks" Inline Prompt (Day 1)
**Where**: Program screen, after task marked
**Trigger**: When `guideShowExplore === true`
**Shows**: Floating banner: "Explore other tasks beyond your anchors!"
**Dismisses**: When user taps "Done" or navigates away

---

## Daily Recap System

### First Visit to Each Screen
**Components**: `FirstVisitOverlay` (used in Stats, UrgeLogger, Program)
**Screens with Intro**:
1. **Stats Screen**: Explains adherence metrics, day counter, progress tracking
2. **UrgeLogger Screen**: Explains urge logging, feelings, triggers, outcomes
3. **Program Screen**: Explains task selection, domains, friction levels

**Behavior**:
- Shows intro only once (persisted in AsyncStorage as `seen_intro_[screen]_v[version]`)
- Non-blocking overlay on first visit
- User taps "Got It" to dismiss
- Never shown again after first visit

---

## Persistence & Storage

### AsyncStorage Keys (Tour/Onboarding)
| Key | Purpose | Values |
|-----|---------|--------|
| `beginnerLaunch_v1` | Triggers delayed modal on "Beginner" button tap | "true" or cleared |
| `guideNeedMarkOne` | Day 1: prompt to mark first task | "true" / "false" |
| `guideShowExplore` | Day 1: prompt to explore other tasks | "true" / "false" |
| `guideSeen_v2` | Product tour completed | "true" or null |
| `seen_intro_stats` | Stats screen first visit done | "true" or null |
| `seen_intro_urges` | UrgeLogger first visit done | "true" or null |
| `seen_intro_program` | Program screen first visit done | "true" or null |
| `program_intro_pending` | Flag to show Program intro next visit | "true" or cleared |

### Context State
| State | Purpose | When Set |
|-------|---------|----------|
| `hasAcceptedTerms` | Legal acceptance completed | After user accepts terms |
| `week1SetupDone` | Week 1 anchors selected | After user confirms 5 picks |
| `week1Anchors` | The 5 anchor tasks selected | After user confirms |
| `todayPicks[day]` | Today's task list | Generated for current day |

---

## Flow Diagram

```
User Login
    ↓
Legal Acceptance Modal (Terms + Privacy)
    ↓ (if accepted)
Product Tour (7-step visual guide)
    ↓ (all steps completed)
Dashboard Day 1
    ↓ (week1SetupDone === false)
Week 1 Anchor Selection Modal (pick 5)
    ↓ (confirmed)
Dashboard with Inline Guides
    ├─ "Mark one task" banner
    └─ "Explore other tasks" banner (after first task)
    ↓ (User marks tasks)
Program Screen
    └─ Inline guide: "Explore tasks" button
    ↓ (First visit to Program)
FirstVisitOverlay: "Program Intro"
    ├─ Tasks grouped by domain
    ├─ Friction levels explained
    └─ Points system shown
    ↓
UrgeLogger Screen (first visit)
    └─ FirstVisitOverlay: "Log Urges Intro"
    ↓
Stats Screen (first visit)
    └─ FirstVisitOverlay: "Stats Intro"
    ↓
Day 2+ (onboarding complete)
    └─ Normal app experience (all guides hidden)
```

---

## Mode: Controller vs Visual

### Visual Mode (First Login)
- OnboardingTour renders modal overlay
- User sees all 7 steps with animations
- Navigates between screens as tour progresses
- Modal is prominent and unskippable

### Controller Mode (Subsequent Logins)
- OnboardingTour runs but **renders nothing** (`controllerOnly={true}`)
- Silently orchestrates navigation & state
- No visual overlay shown
- Sets up guide flags for Day 1 if needed
- Auto-advances based on user actions

---

## Special Cases

### Returning Users (Day 1 Again)
If user returns to Day 1 (via reset or manually):
- Legal modal: **skipped** (already accepted)
- Product tour: **skipped** (already seen)
- Week 1 selection: **skipped** (already done)
- Inline guides: **reset** if `week1SetupDone` reset

### Mood Prompt Integration
- Mood prompt **hidden during onboarding** (Day 1 while `week1SetupDone === false`)
- Shows normally after anchor selection
- Separate system from tour

### Account Deletion
- All tour flags cleared with `AsyncStorage.clear()`
- Next login cycles through full tour again

---

## UX Principles

1. **Non-Blocking**: Guides don't interrupt core tasks after Day 1
2. **Progressive**: Complex features revealed gradually (domains → friction → points)
3. **Persistent**: User progress tracked, won't repeat content
4. **Contextual**: Guides appear in relevant screens (Program for task selection, etc.)
5. **Dismissible**: Inline guides have clear dismiss/acknowledge actions
6. **Visual Polish**: 350-700ms delays prevent jarring transitions

---

## Production Status

✅ **All tour components production-ready**
- Legal acceptance: Robust
- Product tour: 7 comprehensive steps
- Week 1 anchors: Saves to context and storage
- Inline guides: Contextual and non-blocking
- FirstVisit overlays: Per-screen educational content
- Storage: Persistent across sessions

**No changes needed before launch.**

