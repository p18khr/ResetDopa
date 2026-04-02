# 🎨 Landing Page Visual Guide

## Color Palette

```
PRIMARY COLORS:
┌─────────────────────────────────┐
│ Pure Black    #000000  ████████ │
│ Matrix Green  #00FF41  ████████ │
│ Pure White    #FFFFFF  ████████ │
└─────────────────────────────────┘

GRAYSCALE:
┌─────────────────────────────────┐
│ Gray 900      #171717  ████████ │
│ Gray 800      #262626  ████████ │
│ Gray 700      #404040  ████████ │
│ Gray 600      #525252  ████████ │
│ Gray 500      #737373  ████████ │
│ Gray 400      #A3A3A3  ████████ │
└─────────────────────────────────┘
```

---

## Typography Scale

```
IDENTITY FONT (Playfair Display - Serif)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RESET DOPAMINE          (96px - 8xl)
RESET DOPAMINE          (72px - 7xl)
RESET DOPAMINE          (60px - 6xl)
RESET DOPAMINE          (48px - 5xl)
RESET DOPAMINE          (36px - 4xl)


DATA FONT (JetBrains Mono - Monospace)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

> SYSTEM_STATUS: ACTIVE        (12px - xs)
> EXECUTE: FRICTION_GATE       (14px - sm)
> DEPLOYMENT_READY             (16px - base)
```

---

## Component Anatomy

### HERO SECTION
```
┌─────────────────────────────────────────────────────┐
│ [TERMINAL] SYSTEM_STATUS: ACTIVE         v1.0.0     │ ← Status Bar
├─────────────────────────────────────────────────────┤
│                                                      │
│         [🔒] CLASSIFIED: PREMIUM PROTOCOL            │ ← Badge
│                                                      │
│                   RESET                              │
│                DOPAMINE                              │ ← Hero Headline
│                                                      │
│  > 30-DAY NEUROCHEMICAL RECALIBRATION PROTOCOL      │ ← Subheadline
│  > ELIMINATE FRICTION. REBUILD BASELINE. EXECUTE.   │
│                                                      │
│  ┌──────────────────────────────────────┐           │
│  │ [ACTIVITY] DOPAMINE_BASELINE [LIVE]  │           │
│  │ ╱╲    ╱╲    ╱╲    ╱╲    ╱╲          │ ← EKG
│  │                                      │           │
│  │ STATUS: STABLE         BPM: 72      │           │
│  └──────────────────────────────────────┘           │
│                                                      │
│         [INITIATE PROTOCOL →]                        │ ← CTA Button
│                                                      │
│    NO TRIAL. NO COMPROMISE. 30 DAYS OR FAILURE.    │
│                                                      │
│                    ↓                                 │
│             SCROLL TO EXECUTE                        │
└─────────────────────────────────────────────────────┘
```

### FEATURES SECTION (Command Log Style)
```
┌─────────────────────────────────────────────────────┐
│ [TERMINAL] SYSTEM_MODULES                           │
│                                                      │
│ EXECUTION                                            │
│ FRAMEWORK                                            │
│                                                      │
│ > Seven friction gates. Zero negotiation...         │
├─────────────────────────────────────────────────────┤
│ 01  [🛡️]  > EXECUTE: FRICTION_GATE        [ACTIVE] │
│           Behavioral Locks                          │
│           Engineered resistance protocols...        │
├─────────────────────────────────────────────────────┤
│ 02  [⚡]  > EXECUTE: STREAK_ENGINE         [ACTIVE] │
│           Performance Continuity                    │
│           30-day neural rewiring sequence...        │
├─────────────────────────────────────────────────────┤
│ 03  [🎯]  > EXECUTE: TASK_PROTOCOL         [ACTIVE] │
│           Daily Execution Matrix                    │
│           Personalized task bundles across...       │
├─────────────────────────────────────────────────────┤
│ 04  [💓]  > EXECUTE: BIOMETRIC_SYNC        [ACTIVE] │
│           Neurochemical Tracking                    │
│           Calm Points economy. Badge milestone...   │
├─────────────────────────────────────────────────────┤
│ 05  [🧠]  > EXECUTE: AI_COMPANION          [ACTIVE] │
│           DopaGuide Intelligence                    │
│           Local AI companion. Context-aware...      │
└─────────────────────────────────────────────────────┘
```

### STATS SECTION
```
┌─────────────────────────────────────────────────────┐
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ PROTOCOL_│  │ TASK_    │  │ SUCCESS_ │          │
│  │ DURATION │  │ CATEGOR. │  │ THRESHLD │          │
│  │          │  │          │  │          │          │
│  │   30     │  │   07     │  │   70     │          │
│  │          │  │          │  │          │          │
│  │ DAYS     │  │ DOMAINS  │  │ PERCENT  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

### FINAL CTA
```
┌─────────────────────────────────────────────────────┐
│              DEPLOYMENT_READY                        │
│                                                      │
│                  BEGIN                               │
│              RECALIBRATION                           │
│                                                      │
│  > This is not a self-help app. This is a           │
│    systematic neurochemical reset.                  │
│  > 30 days. No extensions. No excuses.              │
│                                                      │
│  [START PROTOCOL →]  [VIEW DOCUMENTATION]           │
│                                                      │
│      > REQUIRES: COMMITMENT.EXE                     │
│      > COMPATIBLE: iOS | ANDROID                    │
└─────────────────────────────────────────────────────┘
```

---

## Hover States

### BUTTONS
```
DEFAULT:
┌────────────────────────┐
│ INITIATE PROTOCOL  →   │  ← Matrix Green BG
└────────────────────────┘

HOVER:
┌────────────────────────┐
│ INITIATE PROTOCOL  →   │  ← White BG + Glow Effect
└────────────────────────┘   (Arrow shifts right)


SECONDARY:
┌────────────────────────┐
│ VIEW DOCUMENTATION  ⌘  │  ← Transparent BG, Gray Border
└────────────────────────┘

HOVER:
┌────────────────────────┐
│ VIEW DOCUMENTATION  ⌘  │  ← Matrix Green Border + Text
└────────────────────────┘
```

### FEATURE ROWS
```
DEFAULT:
──────────────────────────────────────────
01 [🛡️] > EXECUTE: FRICTION_GATE  [ACTIVE]
──────────────────────────────────────────
                ↓
HOVER:
══════════════════════════════════════════  ← Green border
01 [🛡️] > EXECUTE: FRICTION_GATE  [ACTIVE]  ← Green text + Glow
══════════════════════════════════════════
```

---

## Mobile Responsive Breakpoints

### DESKTOP (1024px+)
```
┌─────────────────────────────────────────┐
│  Full 2-column layouts                  │
│  Large typography (96px headlines)      │
│  Wide EKG visualizer (600px)            │
│  Feature list with side-by-side layout  │
└─────────────────────────────────────────┘
```

### TABLET (640px - 1023px)
```
┌─────────────────────────────────┐
│  Reduced typography (60px)      │
│  Medium EKG (500px)             │
│  Features stack vertically      │
└─────────────────────────────────┘
```

### MOBILE (320px - 639px)
```
┌──────────────────────┐
│  Compact layout      │
│  Small type (48px)   │
│  Narrow EKG (280px)  │
│  Full-width buttons  │
│  Stacked stats       │
└──────────────────────┘
```

---

## Glow Effects

### GREEN GLOW (Subtle)
```
box-shadow:
  0 0 10px rgba(0, 255, 65, 0.5),
  0 0 20px rgba(0, 255, 65, 0.3)
```

### GREEN GLOW (Intense - on hover)
```
box-shadow:
  0 0 15px rgba(0, 255, 65, 0.8),
  0 0 30px rgba(0, 255, 65, 0.5),
  0 0 45px rgba(0, 255, 65, 0.3)
```

---

## Animations

### EKG PULSE
```
Duration: 3s
Timing: linear
Loop: infinite
Transform: translateX(0) → translateX(-50%)

Effect: Seamless scrolling heartbeat line
```

### SCAN LINE
```
Duration: 2s
Timing: ease-in-out
Loop: infinite
Opacity: 0.3 → 1 → 0.3

Effect: Pulsing status indicator
```

---

## Grid Pattern (Background)
```
Size: 50px × 50px squares
Color: Matrix Green (#00FF41)
Opacity: 10%
Effect: Subtle tech blueprint feel
```

---

## Icon Usage (Lucide React)

```javascript
import {
  Activity,    // Biometric/EKG
  Zap,        // Energy/Streak
  Brain,      // AI/Intelligence
  Shield,     // Protection/Resistance
  Target,     // Goals/Tasks
  Terminal,   // System/Command
  ChevronRight, // Navigation
  Lock        // Security/Premium
} from 'lucide-react';

Size: 14px (small), 16px (medium)
Color: Gray 600 (default) → Matrix Green (hover/active)
```

---

## Spacing System

```
PADDING SCALE:
p-4  = 16px   (mobile)
p-6  = 24px   (tablet)
p-8  = 32px   (desktop)
p-12 = 48px   (sections)
p-16 = 64px   (large sections)
p-24 = 96px   (hero)

MARGIN SCALE:
mb-4  = 16px  (small gaps)
mb-6  = 24px  (medium gaps)
mb-8  = 32px  (large gaps)
mb-12 = 48px  (section gaps)
mb-16 = 64px  (major section gaps)
```

---

## Print/Screenshot Checklist

When sharing screenshots:

- ✅ Show full hero section (above fold)
- ✅ Capture EKG animation (mid-pulse)
- ✅ Include at least 2-3 feature rows
- ✅ Show button hover states
- ✅ Display mobile view separately
- ✅ Capture in high resolution (2x)
- ✅ Use dark background (screenshots blend in)

---

*Use this guide for design reviews, developer handoff, or client presentations.*
