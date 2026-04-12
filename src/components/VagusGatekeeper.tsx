/**
 * Vagus Gatekeeper Component (REFACTORED)
 *
 * Full-screen overlay that blocks access to restricted apps for 60 seconds
 * Implements reflection → conscious choice → balance check flow
 *
 * Flow:
 * 1. User opens blocked app → 60s countdown starts
 * 2. After 60s → Award +2 points + Show choice screen
 * 3. User chooses:
 *    - [NO] → Close overlay, keep +2 points, return home (SAFE)
 *    - [YES - HOLD 3s] → Open app (NUCLEAR - requires confirmation)
 * 4. Alt: User clicks "Bypass" anytime → Cost 15pts:
 *    - If balance >= 15: Deduct 15, skip 60s wait
 *    - If balance < 15: Show BankruptcyModal
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Alert,
  Pressable,
} from 'react-native';
import { useEconomy } from '../context/EconomyContext';
import { BankruptcyModal } from './BankruptcyModal';
import {
  POINTS_GATE_SURVIVED,
  POINTS_GATE_BYPASSED,
  BANKRUPTCY_BALANCE_THRESHOLD,
  TransactionTypeValue,
  HOLD_TO_CONFIRM_DURATION_MS,
} from '../constants/economyConstants';
import { Ionicons } from '@expo/vector-icons';

/**
 * Hold-to-Confirm Button for opening the app
 * User must hold for 3 seconds
 */
function HoldToConfirmButton({
  onComplete,
  isLoading,
}: {
  onComplete: () => void;
  isLoading: boolean;
}) {
  const holdProgress = useRef(new Animated.Value(0)).current;
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const handlePressIn = () => {
    if (isLoading) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();
    holdProgress.setValue(0);

    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_TO_CONFIRM_DURATION_MS,
      useNativeDriver: false,
    }).start();

    holdTimerRef.current = setTimeout(() => {
      if (isHolding) {
        setIsHolding(false);
        onComplete();
      }
    }, HOLD_TO_CONFIRM_DURATION_MS);
  };

  const handlePressOut = () => {
    const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

    if (elapsedMs < HOLD_TO_CONFIRM_DURATION_MS) {
      setIsHolding(false);
      holdProgress.setValue(0);
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    }
  };

  const progressWidth = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View>
      <Animated.View
        style={[
          styles.progressRing,
          {
            width: progressWidth,
          },
        ]}
      />

      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isLoading}
        style={({ pressed }) => [
          styles.holdButtonContainer,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Text style={styles.holdButtonText}>
          {isLoading
            ? 'Opening...'
            : isHolding
            ? `Hold (${Math.ceil(
                (HOLD_TO_CONFIRM_DURATION_MS - (Date.now() - (startTimeRef.current || Date.now()))) /
                  1000
              )}s)`
            : '💣 YES (Hold 3s)'}
        </Text>
      </Pressable>
    </View>
  );
}

interface VagusGatekeeperProps {
  blockedAppPackage: string;
  blockedAppName: string;
  onGateComplete: () => void; // Called when user survives or proceeds after bankruptcy
  onClose: () => void;
}

export function VagusGatekeeper({
  blockedAppPackage,
  blockedAppName,
  onGateComplete,
  onClose,
}: VagusGatekeeperProps) {
  const { balance, addTransaction, executeBankruptcy } = useEconomy();

  // ===== STATE =====
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [showBankruptcy, setShowBankruptcy] = useState(false);
  const [showPostSurvivalChoice, setShowPostSurvivalChoice] = useState(false); // NEW: Choice screen after 60s
  const [isProcessing, setIsProcessing] = useState(false);
  const [survivalReward, setSurvivalReward] = useState(false); // NEW: Track if +2pts awarded

  // ===== ANIMATIONS =====
  const breathCircleScale = useRef(new Animated.Value(0.8)).current;
  const timerOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // ===== BREATHING ANIMATION =====
  useEffect(() => {
    const breathingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathCircleScale, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathCircleScale, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    breathingLoop.start();

    return () => breathingLoop.stop();
  }, [breathCircleScale]);

  // ===== PULSE ANIMATION (Low Balance Warning) =====
  useEffect(() => {
    if (balance < BANKRUPTCY_BALANCE_THRESHOLD) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      pulseLoop.start();

      return () => pulseLoop.stop();
    }
  }, [balance, pulseAnim]);

  // ===== 60-SECOND COUNTDOWN =====
  useEffect(() => {
    if (timeRemaining === 0) {
      return; // Timer complete
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === 1) {
          handleSurvived();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // ===== HANDLERS =====

  /**
   * User survived the 60s gate (timer completed)
   * Award points + show choice screen
   * User now decides: "Do I still want Instagram?"
   */
  const handleSurvived = useCallback(async () => {
    setIsProcessing(true);

    try {
      const response = await addTransaction(
        TransactionTypeValue.GATE_SURVIVED,
        {
          appBlocked: blockedAppPackage,
        },
        POINTS_GATE_SURVIVED
      );

      if (response.success) {
        setSurvivalReward(true); // +2 points awarded
        setShowPostSurvivalChoice(true); // Show choice screen
      } else {
        Alert.alert('Error', 'Failed to record gate survival. Please try again.');
      }
    } catch (error) {
      console.error('[VagusGatekeeper] Survive error:', error);
      Alert.alert('Error', 'Something went wrong. Please close and retry.');
    } finally {
      setIsProcessing(false);
    }
  }, [blockedAppPackage, addTransaction]);

  /**
   * User attempts to bypass (close the gate early)
   * Check balance and either deduct or trigger bankruptcy
   */
  const handleBypass = useCallback(async () => {
    setIsProcessing(true);

    try {
      // ===== BALANCE CHECK =====
      if (balance >= BANKRUPTCY_BALANCE_THRESHOLD) {
        // ✅ Sufficient balance: Deduct and proceed
        const response = await addTransaction(
          TransactionTypeValue.GATE_BYPASSED,
          {
            appBlocked: blockedAppPackage,
          },
          -POINTS_GATE_BYPASSED
        );

        if (response.success) {
          onGateComplete(); // Proceed to app
        } else {
          Alert.alert('Error', 'Transaction failed. Please try again.');
        }
      } else {
        // ❌ Insufficient balance: Trigger bankruptcy modal
        setShowBankruptcy(true);
      }
    } catch (error) {
      console.error('[VagusGatekeeper] Bypass error:', error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setIsProcessing(false);
    }
  }, [balance, blockedAppPackage, addTransaction, onGateComplete]);

  /**
   * User confirmed bankruptcy in modal
   * Wipe points, reset streak, unlock app
   */
  const handleConfirmBankruptcy = useCallback(async () => {
    try {
      await executeBankruptcy(blockedAppPackage);
      setShowBankruptcy(false);
      onGateComplete(); // Proceed to app
    } catch (error) {
      console.error('[VagusGatekeeper] Bankruptcy execution error:', error);
      Alert.alert('Error', 'Bankruptcy process failed. Please contact support.');
    }
  }, [blockedAppPackage, executeBankruptcy, onGateComplete]);

  /**
   * User said "NO" to opening the app
   * Close overlay, user keeps +2 points, returns home
   */
  const handleRejectApp = useCallback(() => {
    setShowPostSurvivalChoice(false);
    onClose(); // Return to home screen
  }, [onClose]);

  /**
   * User confirmed "YES" to opening the app (after 3s hold)
   * Open the app
   */
  const handleConfirmApp = useCallback(() => {
    setShowPostSurvivalChoice(false);
    onGateComplete(); // Open the blocked app
  }, [onGateComplete]);

  // ===== RENDER =====

  const isLowBalance = balance < BANKRUPTCY_BALANCE_THRESHOLD;
  const isPulsingRed = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 51, 51, 0)', 'rgba(255, 51, 51, 0.6)'],
  });

  return (
    <View style={styles.container}>
      {/* Animated background gradient (breathing effect) */}
      <Animated.View
        style={[
          styles.backgroundGradient,
          {
            transform: [{ scale: breathCircleScale }],
          },
        ]}
      />

      {/* Dark overlay */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        {!showPostSurvivalChoice ? (
          <>
            {/* ===== COUNTDOWN MODE ===== */}
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Breathe. Refocus.</Text>
              <Text style={styles.subtitle}>{blockedAppName} is protected</Text>
            </View>

            {/* Breathing Circle with Timer */}
            <View style={styles.breathingSection}>
          <Animated.View
            style={[
              styles.breathingCircle,
              {
                transform: [{ scale: breathCircleScale }],
              },
            ]}
          >
            <Animated.Text
              style={[
                styles.timer,
                {
                  opacity: timerOpacity,
                },
              ]}
            >
              {timeRemaining}
            </Animated.Text>
          </Animated.View>

          {/* Low Balance Warning (Red pulse) */}
          {isLowBalance && (
            <Animated.View
              style={[
                styles.lowBalanceWarning,
                {
                  backgroundColor: isPulsingRed,
                },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color="#FF3333" />
              <Text style={styles.lowBalanceText}>
                Low balance ({balance}pts) - Bypass will bankrupt you
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Message */}
        <View style={styles.messageSection}>
          <Text style={styles.messageText}>
            Wait {timeRemaining}s to earn <Text style={styles.pointsHighlight}>+{POINTS_GATE_SURVIVED}</Text> Calm
            Points
          </Text>
          <Text style={styles.subtext}>
            Or tap "Bypass" to force access ({POINTS_GATE_BYPASSED} points)
          </Text>
        </View>

        {/* Balance Display */}
        <View style={[styles.balanceCard, isLowBalance && styles.balanceCardWarning]}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={[styles.balanceAmount, isLowBalance && styles.balanceAmountWarning]}>
            {balance}
          </Text>
          <Text style={styles.balancePts}>Calm Points</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          {/* Primary: Wait it out */}
          <TouchableOpacity
            onPress={handleSurvived}
            disabled={isProcessing || timeRemaining > 0}
            style={[
              styles.buttonWait,
              (isProcessing || timeRemaining > 0) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonWaitText}>
              {timeRemaining > 0 ? `Wait ${timeRemaining}s` : '✓ You Survived!'}
            </Text>
          </TouchableOpacity>

          {/* Destructive: Bypass */}
          <TouchableOpacity
            onPress={handleBypass}
            disabled={isProcessing}
            style={[
              styles.buttonBypass,
              isLowBalance && styles.buttonBypassDanger,
              isProcessing && styles.buttonDisabled,
            ]}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={isLowBalance ? '#FF3333' : '#999999'}
            />
            <Text
              style={[
                styles.buttonBypassText,
                isLowBalance && styles.buttonBypassTextDanger,
              ]}
            >
              Bypass (-{POINTS_GATE_BYPASSED})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Resisting urges trains your discipline. Every moment counts.
          </Text>
        </View>
          </>
        ) : (
          <>
            {/* ===== POST-SURVIVAL CHOICE SCREEN ===== */}
            <View style={styles.header}>
              <Text style={styles.title}>You Survived!</Text>
              <Text style={styles.subtitle}>+{POINTS_GATE_SURVIVED} Calm Points Earned</Text>
            </View>

            {/* Reflection Message */}
            <View style={styles.messageSection}>
              <Text style={styles.messageText}>
                Take a moment. Do you still want to open {blockedAppName}?
              </Text>
              <Text style={styles.subtext}>
                You can say "No" and keep your points. The choice is yours.
              </Text>
            </View>

            {/* Choice Buttons */}
            <View style={styles.choiceButtonGroup}>
              {/* SAFE: NO Button (Simple Press) */}
              <TouchableOpacity
                onPress={handleRejectApp}
                disabled={isProcessing}
                style={[
                  styles.buttonNo,
                  isProcessing && styles.buttonDisabled,
                ]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#00CC00" />
                <Text style={styles.buttonNoText}>No, I'm Good</Text>
              </TouchableOpacity>

              {/* NUCLEAR: YES Button (3-Second Hold) */}
              <HoldToConfirmButton
                onComplete={handleConfirmApp}
                isLoading={isProcessing}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                This is your moment to choose. Don't just react—think first.
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Bankruptcy Modal */}
      <BankruptcyModal
        visible={showBankruptcy}
        currentBalance={balance}
        onReturn={handleBankruptcyCancel}
        onConfirmBankruptcy={handleConfirmBankruptcy}
      />
    </View>
  );
}

// ========== STYLES ==========

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backgroundGradient: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(74, 144, 226, 0.15)', // Blue glow
    top: height / 2 - 150,
    left: width / 2 - 150,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },

  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 10,
  },

  // ===== HEADER =====

  header: {
    marginBottom: 32,
    alignItems: 'center',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: '#999999',
    letterSpacing: 0.5,
  },

  // ===== BREATHING SECTION =====

  breathingSection: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },

  breathingCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(74, 144, 226, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(74, 144, 226, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  timer: {
    fontSize: 64,
    fontWeight: '900',
    color: '#4A90E2',
  },

  lowBalanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3333',
    gap: 8,
  },

  lowBalanceText: {
    fontSize: 12,
    color: '#FF3333',
    fontWeight: '600',
  },

  // ===== MESSAGE =====

  messageSection: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },

  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  pointsHighlight: {
    color: '#00CC00',
    fontWeight: '700',
  },

  subtext: {
    fontSize: 12,
    color: '#999999',
  },

  // ===== BALANCE CARD =====

  balanceCard: {
    width: '100%',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(74, 144, 226, 0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 28,
  },

  balanceCardWarning: {
    backgroundColor: 'rgba(255, 51, 51, 0.1)',
    borderColor: 'rgba(255, 51, 51, 0.5)',
  },

  balanceLabel: {
    fontSize: 11,
    color: '#999999',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },

  balanceAmount: {
    fontSize: 36,
    fontWeight: '900',
    color: '#4A90E2',
  },

  balanceAmountWarning: {
    color: '#FF3333',
  },

  balancePts: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },

  // ===== BUTTONS =====

  buttonGroup: {
    width: '100%',
    gap: 12,
  },

  buttonWait: {
    backgroundColor: '#00CC00',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonWaitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },

  buttonBypass: {
    backgroundColor: 'rgba(100, 100, 100, 0.2)',
    borderWidth: 1,
    borderColor: '#666666',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonBypassDanger: {
    backgroundColor: 'rgba(255, 51, 51, 0.15)',
    borderColor: '#FF3333',
  },

  buttonBypassText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999999',
    letterSpacing: 0.3,
  },

  buttonBypassTextDanger: {
    color: '#FF3333',
    fontWeight: '700',
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  // ===== FOOTER =====

  footer: {
    marginTop: 28,
    paddingHorizontal: 16,
  },

  footerText: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // ===== CHOICE SCREEN STYLES =====

  choiceButtonGroup: {
    width: '100%',
    gap: 12,
  },

  buttonNo: {
    backgroundColor: '#00CC00',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  buttonNoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },

  // ===== HOLD BUTTON STYLES =====

  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: '#FF3333',
    opacity: 0.2,
    zIndex: 0,
  },

  holdButtonContainer: {
    position: 'relative',
    backgroundColor: 'rgba(255, 51, 51, 0.15)',
    borderWidth: 2,
    borderColor: '#FF3333',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },

  holdButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3333',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
