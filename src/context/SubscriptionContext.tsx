import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, {
  LOG_LEVEL,
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const RC_API_KEY_ANDROID = 'test_CKqpOWkmCWNdRzUzRjvcpCsaPwI';
export const ENTITLEMENT_ID = 'ResetDopa Pro';

export interface SubscriptionContextValue {
  isPremium: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;
  presentPaywall: () => Promise<PAYWALL_RESULT>;
  presentPaywallIfNeeded: () => Promise<PAYWALL_RESULT>;
  presentCustomerCenter: () => Promise<void>;
  restorePurchases: () => Promise<boolean>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  debugSetPremium: (value: boolean | null) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  userId?: string;
  children: ReactNode;
}

export function SubscriptionProvider({ userId, children }: SubscriptionProviderProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugPremiumOverride, setDebugPremiumOverride] = useState<boolean | null>(null);

  // Load persisted dev override on mount so it survives Fast Refresh and navigation
  useEffect(() => {
    if (!__DEV__) return;
    AsyncStorage.getItem('__dev_premium_override__').then((val) => {
      if (val === 'true') setDebugPremiumOverride(true);
    });
  }, []);
  const configured = useRef(false);

  const rcIsPremium =
    customerInfo != null &&
    customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;

  const isPremium = __DEV__ && debugPremiumOverride !== null ? debugPremiumOverride : rcIsPremium;

  const debugSetPremium = useCallback((value: boolean | null) => {
    if (!__DEV__) return;
    setDebugPremiumOverride(value);
    if (value === true) {
      AsyncStorage.setItem('__dev_premium_override__', 'true');
    } else {
      AsyncStorage.removeItem('__dev_premium_override__');
    }
  }, []);

  // Sync premium status to Firestore so Cloud Functions can read it server-side
  useEffect(() => {
    if (!userId) return;
    updateDoc(doc(db, 'users', userId), {
      'subscription.isPremium': isPremium,
      'subscription.syncedAt': new Date(),
    }).catch(() => {
      // Non-fatal: weekly audit falls back to free tier
    });
  }, [isPremium, userId]);

  // Configure RevenueCat once and set up real-time listener
  useEffect(() => {
    if (configured.current) return;
    configured.current = true;

    if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);

    // iOS would use a separate key; Android-only for now
    if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: RC_API_KEY_ANDROID });
    } else {
      Purchases.configure({ apiKey: RC_API_KEY_ANDROID });
    }

    const boot = async () => {
      try {
        const [info, offs] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        setCustomerInfo(info);
        setOfferings(offs);
      } catch (e) {
        console.warn('[Subscription] boot error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    boot();

    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      setCustomerInfo(info);
    });

    return () => {
      listener.remove();
    };
  }, []);

  // Re-identify user when auth state changes (login / logout)
  useEffect(() => {
    if (!configured.current) return;
    if (userId) {
      Purchases.logIn(userId).catch((e) =>
        console.warn('[Subscription] logIn error:', e)
      );
    } else {
      Purchases.logOut().catch(() => {});
    }
  }, [userId]);

  const presentPaywall = useCallback(async (): Promise<PAYWALL_RESULT> => {
    return RevenueCatUI.presentPaywall();
  }, []);

  const presentPaywallIfNeeded = useCallback(async (): Promise<PAYWALL_RESULT> => {
    return RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_ID,
    });
  }, []);

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    await RevenueCatUI.presentCustomerCenter({
      callbacks: {
        onRestoreCompleted: ({ customerInfo: info }) => setCustomerInfo(info),
        onRestoreFailed: ({ error }) =>
          console.warn('[Subscription] restore failed:', error),
      },
    });
  }, []);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);
      return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e) {
      console.warn('[Subscription] restore error:', e);
      return false;
    }
  }, []);

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      return info.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (e: any) {
      if (!e.userCancelled) throw e;
      return false;
    }
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        customerInfo,
        offerings,
        presentPaywall,
        presentPaywallIfNeeded,
        presentCustomerCenter,
        restorePurchases,
        purchasePackage,
        debugSetPremium,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be inside SubscriptionProvider');
  return ctx;
}
