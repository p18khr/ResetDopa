/**
 * Calm Points Economy - Recalibrated Constants
 *
 * Calibrated to prevent hyperinflation and enforce strict bankruptcy mechanics
 * All values locked for Phase 3 Production
 */

// ========== POINT EARNING (FAUCETS) ==========

/**
 * Points earned when user survives the 60-second Vagus Gate
 * (Resists urge to access blocked app)
 */
export const POINTS_GATE_SURVIVED = 2;

/**
 * Base points for completing daily tasks
 * (Multiplied by task difficulty: easy=1x, medium=2x, hard=2.5x)
 */
export const POINTS_TASK_BASE = 5;

export const TASK_DIFFICULTY_MULTIPLIERS = {
  easy: 1,      // 5 points
  medium: 2,    // 10 points
  hard: 2.5,    // 12.5 → 12 points (clamped to integer)
} as const;

// ========== POINT LOSS (PUNISHMENTS) ==========

/**
 * Points deducted when user bypasses the Vagus Gate
 * (Forces access to blocked app within 60s)
 *
 * NOTE: If balance < 15, triggers BankruptcyModal
 */
export const POINTS_GATE_BYPASSED = 15;

// ========== STORE PRICING (SINKS) ==========

/**
 * Premium Store Item Costs (in Calm Points)
 * These are sinks that remove points from the economy
 */
export const STORE_ITEMS = {
  // Rescues (fix broken state)
  STREAK_REPAIR: {
    id: 'streak_repair',
    name: 'Streak Repair',
    description: 'Restore your broken streak and resume progress (one-time use)',
    cost: 400,
    category: 'boost',
    sku: 'streak_repair_once',
    available: true,
    duration: null, // immediate/permanent
    maxPurchasesPerMonth: 1, // User can only repair once per month
  },

  // Cosmetics (visual customization)
  VANTABLACK_THEME: {
    id: 'vantablack_theme',
    name: 'Vantablack Theme',
    description: 'Minimal, pure black theme for OLED devices (reduces eye strain)',
    cost: 1000,
    category: 'cosmetic',
    sku: 'theme_vantablack',
    available: true,
    duration: null, // permanent
    requiresPremium: false,
  },
} as const;

// ========== BANKRUPTCY MECHANICS ==========

/**
 * Balance threshold below which bypassing triggers bankruptcy instead of deduction
 */
export const BANKRUPTCY_BALANCE_THRESHOLD = POINTS_GATE_BYPASSED; // 15 points

/**
 * Consequences of bankruptcy
 */
export const BANKRUPTCY_CONSEQUENCES = {
  streak: 0,           // Streak reset to 0
  balance: 0,          // Balance wiped to 0
  logBreach: true,     // Protocol breach logged
  daysCooldown: 7,     // User cannot repair for 7 days
} as const;

// ========== HOLD-TO-CONFIRM SETTINGS ==========

/**
 * Time required to hold "Shatter Streak" button (milliseconds)
 */
export const HOLD_TO_CONFIRM_DURATION_MS = 3000; // 3 seconds

/**
 * Visual feedback: frequency of progress ring updates (ms)
 */
export const HOLD_PROGRESS_UPDATE_INTERVAL_MS = 50;

// ========== LIMITS & CAPS ==========

/**
 * Maximum points a user can hold (hyperinflation cap)
 */
export const MAX_BALANCE_CAP = 10000;

/**
 * Minimum balance (never below 0)
 */
export const MIN_BALANCE = 0;

/**
 * Max transactions per user per hour (fraud detection)
 */
export const MAX_TRANSACTIONS_PER_HOUR = 100;

/**
 * Offline transaction queue limit (prevent memory leak)
 */
export const MAX_PENDING_TRANSACTIONS = 50;

// ========== TRANSACTION TYPE MAPPING ==========

export enum TransactionTypeValue {
  GATE_SURVIVED = 'gate_survived',
  GATE_BYPASSED = 'gate_bypassed',
  TASK_COMPLETE = 'task_complete',
  STORE_PURCHASE = 'store_purchase',
  BANKRUPTCY_BREACH = 'bankruptcy_breach',
  STREAK_REPAIR = 'streak_repair',
  ADMIN_ADJUSTMENT = 'admin_adjustment',
}

/**
 * Map transaction type to point value
 * (Used by Cloud Function to determine amount if not specified)
 */
export const TRANSACTION_POINT_VALUES: Record<TransactionTypeValue, number | null> = {
  [TransactionTypeValue.GATE_SURVIVED]: POINTS_GATE_SURVIVED,
  [TransactionTypeValue.GATE_BYPASSED]: -POINTS_GATE_BYPASSED,
  [TransactionTypeValue.TASK_COMPLETE]: null, // Determined by task difficulty
  [TransactionTypeValue.STORE_PURCHASE]: null, // Determined by item cost
  [TransactionTypeValue.BANKRUPTCY_BREACH]: null, // Clamp to available balance
  [TransactionTypeValue.STREAK_REPAIR]: -(STORE_ITEMS.STREAK_REPAIR.cost),
  [TransactionTypeValue.ADMIN_ADJUSTMENT]: null, // Admin-specified
};

// ========== UI CONSTANTS ==========

export const BANKRUPTCY_UI = {
  title: 'INSUFFICIENT CAPITAL.',
  subtitle: 'Cognitive Bankruptcy Triggered',
  body: 'You cannot afford this distraction. Proceeding will trigger Cognitive Bankruptcy:\n\n' +
        '• Streak reset to 0\n' +
        '• Balance wiped\n' +
        '• Protocol breach logged\n\n' +
        'You may repair your streak in 7 days by earning 400 Calm Points.',
  colors: {
    background: '#0A0A0A',        // Pure black
    border: '#FF3333',             // Red accent
    text: '#FFFFFF',               // White
    textSecondary: '#999999',      // Gray
    buttonPrimary: '#00CC00',      // Green (Return)
    buttonDestructive: '#FF3333',  // Red (Shatter)
  },
  buttons: {
    return: 'Return to Protocol',
    shatter: 'Shatter Streak',
    holding: 'Hold 3 seconds...',
  },
} as const;

// ========== EXPORT SUMMARY ==========

export const EconomyConstants = {
  earning: {
    gateSurvived: POINTS_GATE_SURVIVED,
  },
  loss: {
    gateBypass: POINTS_GATE_BYPASSED,
  },
  store: STORE_ITEMS,
  bankruptcy: {
    threshold: BANKRUPTCY_BALANCE_THRESHOLD,
    consequences: BANKRUPTCY_CONSEQUENCES,
  },
  ui: BANKRUPTCY_UI,
};
