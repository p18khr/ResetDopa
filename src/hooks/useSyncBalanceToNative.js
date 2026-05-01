import { useEffect, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { useEconomy } from '../context/EconomyContext';
import { useAppBlocker } from './useAppBlocker';

/**
 * useSyncBalanceToNative
 *
 * Syncs balance/streak to native IMMEDIATELY whenever they change.
 * Uses calmPoints from AppContext (the authoritative source shown on Dashboard)
 * and currentStreak from EconomyContext.
 */
export function useSyncBalanceToNative() {
  const { calmPoints, streak } = useContext(AppContext);
  const { currentStreak } = useEconomy();
  const { syncBalanceToNative } = useAppBlocker();

  // hasStreak: true if user has active days streak OR EconomyContext hasn't broken it
  const hasStreak = Boolean(currentStreak);

  useEffect(() => {
    console.log('━━━ [SyncBalance] EFFECT FIRED ━━━');
    console.log('[SyncBalance] calmPoints:', calmPoints, 'streak:', streak, 'hasStreak:', hasStreak);

    if (!syncBalanceToNative) {
      console.error('[SyncBalance] ❌ syncBalanceToNative is null!');
      return;
    }

    const safePoints = typeof calmPoints === 'number' ? calmPoints : 0;
    const streakDays = typeof streak === 'number' ? streak : 0;
    const isVeteran = safePoints >= 100 && streakDays >= 3;
    console.log('[SyncBalance] ✅ CALLING syncBalanceToNative with:', { safePoints, hasStreak, isVeteran });

    syncBalanceToNative(safePoints, hasStreak, isVeteran)
      .then(() => {
        console.log('[SyncBalance] ✅ Sync completed successfully');
      })
      .catch(err => {
        console.error('[SyncBalance] ❌ Sync failed:', err);
      });
  }, [calmPoints, hasStreak, syncBalanceToNative]);
}

export default useSyncBalanceToNative;
