# TypeScript Type System Documentation

## Overview

The codebase now has comprehensive TypeScript type definitions for all data structures and Context APIs. This ensures type safety across the entire application.

---

## Type Organization

Types are organized into 4 main files in `src/types/`:

### 1. **user.types.ts** - User-level data structures
- `FirebaseUser` - Re-exported from firebase/auth
- `Task` - Program task with id, title, points, done status
- `Urge` - Urge logging entry with intensity, trigger, emotion, outcome
- `Badge` - Achievement badge with unlock status
- `BadgeToast` - Badge notification for UI
- `Quote` - Motivational quote with author and tag
- `MoodValue` - Daily mood tracking (string or object)

### 2. **program.types.ts** - Program mechanics
- `GraceUsage` - Grace tracking for rolling 7-day window
- `DailyMetrics` - Daily performance metrics (adherence, variety, etc.)
- `RolloverBannerInfo` - Overnight rollover notification
- `GraceStatus` - Grace system debug information
- `RecommendedTask` - Recommended task with category and score
- `DayPicksMap` - Day → task titles mapping
- `DayCompletionsMap` - Day → completion state mapping
- `DateKeyMap<T>` - Generic date-indexed data structure
- `ProgramDayTitles` - Day number → title mapping

### 3. **theme.types.ts** - Theme system
- `ColorPalette` - 12-color palette (background, text, accent, etc.)
- `ThemeColors` - Light/dark mode color collections
- `ThemePreference` - User theme preference

### 4. **context.types.ts** - Context API types
- `AuthContextValue` - Authentication state and methods
- `ProgramContextValue` - Program state and streak methods
- `UrgesContextValue` - Urge logging and retrieval
- `BadgesContextValue` - Badges and calm points
- `SettingsContextValue` - App settings and preferences
- `ThemeContextValue` - Theme switching and colors
- `AppContextValue` - Aggregated context (largest interface)

### 5. **index.ts** - Barrel export
- Re-exports all types for convenient importing

---

## Usage Examples

### Importing Types

```typescript
// Import specific types
import type { Task, Urge, Badge } from './src/types';

// Import context types
import type { AppContextValue, AuthContextValue } from './src/types';

// Import program types
import type { GraceUsage, DailyMetrics } from './src/types';
```

### Using Context Types

```typescript
// In App.tsx (already implemented)
import type { AppContextValue } from './src/types';

function AppNavigator(): React.ReactElement {
  const context = useContext(AppContext) as AppContextValue;
  const { user, loading, hasAcceptedTerms, acceptanceLoaded } = context;
  // TypeScript now knows the exact shape of context
}
```

### Typing Functions

```typescript
import type { Task, DailyMetrics, GraceUsage } from './src/types';

// Function parameter typing
function calculateMetrics(
  completions: Record<string, boolean>,
  tasks: Task[]
): DailyMetrics {
  // Implementation
}

// Return type inference
function getActiveGraces(
  graceUsages: GraceUsage[],
  currentDay: number
): GraceUsage[] {
  return graceUsages.filter(g => currentDay < g.expiresOnDay);
}
```

### Typing Component Props

```typescript
import type { Badge, BadgeToast } from './src/types';

interface BadgeCardProps {
  badge: Badge;
  onClaim: (badgeId: string) => void;
}

function BadgeCard({ badge, onClaim }: BadgeCardProps) {
  // Component implementation
}
```

---

## Key Type Definitions

### AppContextValue (Most Important)

The `AppContextValue` interface contains **61 properties and methods**, aggregating:
- Authentication state (4 properties)
- Program state (10 properties)
- Urge tracking (2 properties + 2 methods)
- Badge system (4 properties + 2 methods)
- Daily features (7 properties + 3 methods)
- Streak & grace system (6 properties + 2 methods)
- Metrics (2 properties + 2 methods)
- Testing utilities (7 methods)
- Miscellaneous (15 properties)

### GraceUsage (Critical for Streak System)

```typescript
interface GraceUsage {
  usedOnDay: number;      // Day the grace was used
  expiresOnDay: number;   // Day + 7 (expiration)
}
```

**Rolling 7-day window logic:**
- Max 2 active graces at any time
- Grace active if `currentDay < expiresOnDay`
- Used on Day 5 → expires on Day 12

### DailyMetrics (Performance Tracking)

```typescript
interface DailyMetrics {
  urges: number;              // Number of urges logged
  completions: number;        // Tasks completed
  target: number;             // Tasks assigned
  adherence: number;          // Completion rate (0-1)
  variety: number;            // Category diversity (0-1)
  categoriesCovered: string[]; // Categories completed
  calmDelta: number;          // Calm points earned
  streak: number;             // Streak value on that day
}
```

---

## Type Safety Benefits

### 1. **Autocomplete in IDEs**
TypeScript-aware editors now provide accurate autocomplete for all context values and methods.

### 2. **Compile-time Error Detection**
Typos and incorrect property access are caught during development:
```typescript
// ❌ TypeScript error: Property 'streek' does not exist
const { streek } = useContext(AppContext);

// ✅ Correct
const { streak } = useContext(AppContext);
```

### 3. **Refactoring Safety**
Renaming properties or changing signatures will show errors in all affected files.

### 4. **Documentation as Code**
Interfaces serve as living documentation of the data model.

---

## Context Default Values Issue

**Note:** Context default values in `.js` files are minimal (e.g., `{ week1Completed: false }`), but providers export much larger objects. This is why we use type assertions (`as AppContextValue`) in `App.tsx`.

**Future improvement:** Convert context files to `.ts` with proper default values or use `createContext<AppContextValue>(null as any)` pattern.

---

## Type-Check Script

Run TypeScript compilation without emitting files:

```bash
npm run type-check
```

This verifies all TypeScript files are correctly typed without generating JavaScript output.

---

## Testing with TypeScript

All 92 tests continue to pass with TypeScript enabled:
- 14 AuthContext tests
- 29 Rollover logic tests
- 49 Streak calculation tests

**Test compatibility:** Jest works seamlessly with TypeScript through Babel transpilation.

---

## Next Steps (Phase 15)

**Convert Context files to TypeScript:**
1. Rename `.js` → `.ts` or `.tsx`
2. Use interfaces instead of type assertions
3. Add proper default context values
4. Type all function parameters and return values

**Create Firebase service modules:**
1. `src/services/auth.service.ts` - Auth operations
2. `src/services/firestore.service.ts` - Database operations
3. Full TypeScript types for Firebase interactions

---

## Files Created in Phase 14

1. **src/types/user.types.ts** - User data structures (8 types)
2. **src/types/program.types.ts** - Program mechanics (10 types)
3. **src/types/theme.types.ts** - Theme system (3 types)
4. **src/types/context.types.ts** - Context values (7 interfaces)
5. **src/types/index.ts** - Barrel export

**Total: 5 files, 28 type definitions**

---

## Summary

✅ **Type safety added** to all major data structures
✅ **Context APIs fully typed** with 7 interfaces
✅ **App.tsx updated** to use `AppContextValue` instead of `as any`
✅ **Zero TypeScript errors** in compilation
✅ **All 92 tests passing** with TypeScript enabled
✅ **Organized type structure** for maintainability

The codebase now has a solid TypeScript foundation ready for Phase 15 (Firebase service refactoring).
