/**
 * Calm Points Economy Type Definitions
 * Production-ready interfaces for Firebase/React Native integration
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Transaction Type Enum
 * Defines all possible ways user can earn/lose calm points
 */
export enum TransactionType {
  TASK_COMPLETE = 'task_complete',        // +10 to +50 points
  GATE_SURVIVED = 'gate_survived',        // +50 points (user resisted blocked app for 60s)
  GATE_BYPASSED = 'gate_bypassed',        // -100 points (user forced access to blocked app)
  STORE_PURCHASE = 'store_purchase',      // -cost points (user bought premium item)
  STREAK_RESET = 'streak_reset',          // 0 points (automatic bankruptcy)
  ADMIN_ADJUSTMENT = 'admin_adjustment',  // ±N points (support override)
}

/**
 * Transaction Status for Offline Sync
 */
export enum TransactionStatus {
  COMPLETED = 'completed',   // Confirmed on server
  PENDING = 'pending',       // Queued locally, waiting for sync
}

/**
 * Transaction Metadata - Optional context for each transaction
 * Help track the origin and reason for point changes
 */
export interface TransactionMetadata {
  taskId?: string;           // Task that was completed
  taskTitle?: string;        // Task name (for display)
  appBlocked?: string;       // Package name of blocked app (e.g., 'com.instagram.android')
  itemPurchased?: string;    // Store item ID
  reasonForReset?: string;   // Why streak was reset (e.g., 'bankruptcy', 'manual')
  customNote?: string;       // Admin notes
}

/**
 * Core Transaction Document
 * Stored in: users/{userId}/transactions/{transactionId}
 *
 * SECURITY: Only Cloud Functions can create these
 * IMMUTABLE: Never modified after creation
 * TIMESTAMPS: Always server-generated (prevents time-travel cheats)
 */
export interface Transaction {
  id: string;                              // Document ID (UUID)
  amount: number;                          // +N or -N (never exceeds available balance)
  type: TransactionType;                   // Category of transaction
  timestamp: Timestamp;                    // Server timestamp (use FieldValue.serverTimestamp())
  metadata: TransactionMetadata;           // Optional context
  status: TransactionStatus;               // 'completed' or 'pending'
  idempotencyKey: string;                  // UUID to prevent duplicate processing
  processedBy: 'cloud_function' | 'rule';  // Audit trail: who created this?
}

/**
 * Premium Store Item
 * Stored in: premium_store/{itemId}
 *
 * Items users can purchase with calm points
 */
export enum StoreItemCategory {
  THEME = 'theme',           // Visual customizations
  FEATURE = 'feature',       // Functional additions (e.g., AI reports)
  BOOST = 'boost',           // Temporary power-ups (e.g., 2x points for 24h)
  COSMETIC = 'cosmetic',     // Badges, profile items, etc.
}

export interface StoreItem {
  id: string;                            // Document ID (must match SKU for analytics)
  name: string;                          // Display name
  description: string;                   // What does this item do?
  cost: number;                          // Calm points required to purchase
  category: StoreItemCategory;           // Type of item
  sku: string;                           // Stock keeping unit (for revenue tracking)
  available: boolean;                    // Is this item currently available?
  maxPurchasesPerMonth?: number;         // null = unlimited. Optional monthly cap
  createdAt: Timestamp;                  // When item was added to store
  updatedAt: Timestamp;                  // Last modified
  requiresPremium: boolean;              // Must have active premium subscription?
  imageUrl?: string;                     // URL to item icon/preview
  metadata?: {
    durations?: number;                  // If time-limited (e.g., 30 days)
    theme?: string;                      // If theme item, which theme ID?
    featureUnlock?: string;              // If feature, which feature flag?
  };
}

/**
 * User Purchase Record
 * Stored in: users/{userId}/purchases/{itemId}
 *
 * Tracks what the user has bought and when it expires
 */
export interface UserPurchase {
  itemId: string;                       // Reference to premium_store item
  grantedAt: Timestamp;                 // When purchase completed
  expiresAt?: Timestamp;                // When (optional) benefit expires
  quantity?: number;                    // For consumable items
}

/**
 * User Economy Profile
 * Part of: users/{userId} document
 *
 * Derived fields (NOT stored, computed from transactions):
 * - currentBalance: sum(transactions where status='completed')
 */
export interface UserEconomyProfile {
  userId: string;                       // Firebase Auth UID
  email: string;                        // User email
  createdAt: Timestamp;                 // When account was created
  currentStreak: boolean;               // Is streak active? (set to false on bankruptcy)
  lastActivityDate: Timestamp;          // Last transaction/activity timestamp
  totalPointsLiftime: number;           // Cumulative points ever earned (for leaderboards)
  metadata: {
    deviceId: string;                   // For fraud detection (sudden device changes)
    lastDeviceTime?: Timestamp;         // Last seen device time (detect cheating)
  };
}

/**
 * Economy State (React Context)
 * What the frontend holds in memory
 */
export interface EconomyState {
  balance: number;                      // Current calm points (derived from transactions)
  currentStreak: boolean;               // Is streak active?
  lastTransactions: Transaction[];      // Last 10 transactions (for display)
  isLoading: boolean;                   // Fetching balance from server?
  error: string | null;                 // Error message if balance fetch failed
  lastSyncTime?: Timestamp;             // When was balance last synced?
}

/**
 * Cloud Function Request Payload
 * Sent from React Native app to Firebase Cloud Function
 */
export interface CreateTransactionRequest {
  type: TransactionType;                // What type of transaction?
  amount?: number;                      // Optional (will be determined by type in Cloud Function)
  metadata: TransactionMetadata;        // Context: taskId, appBlocked, etc.
  idempotencyKey: string;               // UUID to prevent double-processing
}

/**
 * Cloud Function Response
 */
export interface CreateTransactionResponse {
  success: boolean;
  transaction?: Transaction;            // The created transaction
  balance?: number;                     // New balance after transaction
  streakBroken?: boolean;              // Was streak broken?
  error?: string;                       // Error message if failed
}

/**
 * Premium Store Purchase Request
 */
export interface PurchaseItemRequest {
  itemId: string;                       // premium_store/{itemId}
  idempotencyKey: string;               // UUID
}

/**
 * Premium Store Purchase Response
 */
export interface PurchaseItemResponse {
  success: boolean;
  item?: StoreItem;                     // The purchased item
  balance?: number;                     // New balance
  purchase?: UserPurchase;              // Purchase record
  error?: string;  // 'insufficient_balance' | 'item_unavailable' | 'monthly_limit_exceeded' | etc.
}

/**
 * Pending Transaction (Local Storage)
 * Used during offline mode before syncing to Cloud Function
 */
export interface PendingTransaction extends CreateTransactionRequest {
  localId: string;                      // Temporary local ID
  createdAtLocal: number;               // Local timestamp (milliseconds)
  retryCount: number;                   // How many times we've tried to sync
}
