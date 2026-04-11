/**
 * BankruptcyModal Component
 *
 * Displays when user attempts to bypass Vagus Gate without sufficient points
 * Features brutalist dark UI with red accents + 3-second hold-to-confirm button
 *
 * Usage:
 * <BankruptcyModal
 *   visible={isBankrupt}
 *   currentBalance={balance}
 *   onReturn={() => setIsBankrupt(false)}
 *   onConfirmBankruptcy={executeBankruptcy}
 * />
 */

import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Animated,
  PanResponder,
  GestureResponderEvent,
  PressableProps,
  Pressable,
  Dimensions,
} from 'react-native';
import { BANKRUPTCY_UI, HOLD_TO_CONFIRM_DURATION_MS } from '../constants/economyConstants';

interface BankruptcyModalProps {
  visible: boolean;
  currentBalance: number;
  onReturn: () => void;
  onConfirmBankruptcy: () => Promise<void>;
}

/**
 * Hold-to-Confirm Button Component
 *
 * User must continuously press for 3 seconds to confirm bankruptcy
 * Releases before 3s = cancels
 * Holds for 3s = executes bankruptcy
 */
function HoldToConfirmButton({
  onComplete,
  onCancel,
  isLoading,
}: {
  onComplete: () => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const holdProgress = useRef(new Animated.Value(0)).current;
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Progress ring animation (0 → 1 over 3s)
  const progressRingScale = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const buttonOpacity = holdProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.8],
  });

  const handlePressIn = () => {
    if (isLoading) return;

    setIsHolding(true);
    startTimeRef.current = Date.now();
    holdProgress.setValue(0);

    // Animate progress over 3 seconds
    Animated.timing(holdProgress, {
      toValue: 1,
      duration: HOLD_TO_CONFIRM_DURATION_MS,
      useNativeDriver: false,
    }).start();

    // Set timer: if user is still holding after 3s, execute
    holdTimerRef.current = setTimeout(() => {
      if (isHolding) {
        setIsHolding(false);
        onComplete();
      }
    }, HOLD_TO_CONFIRM_DURATION_MS);
  };

  const handlePressOut = () => {
    const elapsedMs = startTimeRef.current ? Date.now() - startTimeRef.current : 0;

    // If released before 3s, cancel
    if (elapsedMs < HOLD_TO_CONFIRM_DURATION_MS) {
      setIsHolding(false);
      holdProgress.setValue(0);
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      onCancel();
    }
    // If held for 3s+, onComplete will be called by timer
  };

  return (
    <View>
      {/* Progress Ring (filled background) */}
      <Animated.View
        style={[
          styles.progressRing,
          {
            width: holdProgress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />

      {/* Button */}
      <Animated.View
        style={[
          styles.holdButton,
          {
            opacity: buttonOpacity,
          },
        ]}
      >
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.holdButtonInner,
            pressed && { transform: [{ scale: 0.95 }] },
          ]}
        >
          <Text style={styles.holdButtonText}>
            {isLoading
              ? 'Processing...'
              : isHolding
              ? `Holding... (${Math.ceil(
                  (HOLD_TO_CONFIRM_DURATION_MS - (Date.now() - (startTimeRef.current || Date.now()))) / 1000
                )}s)`
              : '๏ SHATTER STREAK'}
          </Text>

          {/* Progress indicator (circular visual) */}
          {isHolding && (
            <View style={styles.progressIndicator}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: holdProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

/**
 * Main Bankruptcy Modal
 */
export function BankruptcyModal({
  visible,
  currentBalance,
  onReturn,
  onConfirmBankruptcy,
}: BankruptcyModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const handleConfirmBankruptcy = async () => {
    setIsConfirming(true);
    try {
      await onConfirmBankruptcy();
      // Modal will close after function completes
    } catch (error) {
      console.error('Bankruptcy confirmation error:', error);
      setIsConfirming(false);
    }
  };

  const handleCancel = () => {
    setIsConfirming(false);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onReturn}
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Dark backdrop */}
        <View style={styles.backdropOverlay} />

        {/* Modal Card */}
        <View style={styles.centeredView}>
          <Animated.View
            style={[
              styles.modalView,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    scale: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Red Border Top */}
            <View style={styles.borderTop} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>{BANKRUPTCY_UI.title}</Text>
              <Text style={styles.subtitle}>
                {/* Glitch effect: repeated line */}
                <Text style={styles.glitch}>COGNITIVE BANKRUPTCY</Text>
              </Text>
            </View>

            {/* Body */}
            <View style={styles.body}>
              <Text style={styles.bodyText}>{BANKRUPTCY_UI.body}</Text>

              {/* Current Balance Display */}
              <View style={styles.balanceWarning}>
                <Text style={styles.balanceLabel}>Current Balance:</Text>
                <Text style={styles.balanceAmount}>{currentBalance} pts</Text>
                <Text style={styles.balanceHint}>
                  (Bypass costs {15} pts • You have {currentBalance < 15 ? 'INSUFFICIENT' : 'ADEQUATE'} capital)
                </Text>
              </View>

              {/* Warning Box */}
              <View style={styles.warningBox}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  This action CANNOT be undone. Repair available in 7 days via Streak Repair (400 pts).
                </Text>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              {/* Primary: Return to Protocol (Green) */}
              <Pressable
                onPress={onReturn}
                disabled={isConfirming}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && { opacity: 0.8 },
                  isConfirming && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  ✓ {BANKRUPTCY_UI.buttons.return}
                </Text>
              </Pressable>

              {/* Destructive: Shatter Streak (Hold 3s) */}
              <HoldToConfirmButton
                onComplete={handleConfirmBankruptcy}
                onCancel={handleCancel}
                isLoading={isConfirming}
              />
            </View>

            {/* Footer Info */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                This is a safety measure to prevent impulsive decisions. Hold the red button for 3 seconds if you
                understand the consequences.
              </Text>
            </View>

            {/* Red Border Bottom */}
            <View style={styles.borderBottom} />
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ========== STYLES ==========

const { width } = Dimensions.get('window');
const MODAL_WIDTH = width * 0.9;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },

  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },

  modalView: {
    width: MODAL_WIDTH,
    backgroundColor: BANKRUPTCY_UI.colors.background,
    borderWidth: 2,
    borderColor: BANKRUPTCY_UI.colors.border,
    borderRadius: 0, // Brutalist: no rounded corners
    overflow: 'hidden',
    shadowColor: BANKRUPTCY_UI.colors.border,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 20,
  },

  borderTop: {
    height: 3,
    backgroundColor: BANKRUPTCY_UI.colors.border,
  },

  borderBottom: {
    height: 3,
    backgroundColor: BANKRUPTCY_UI.colors.border,
  },

  // ===== HEADER =====

  header: {
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: BANKRUPTCY_UI.colors.border,
  },

  title: {
    fontSize: 28,
    fontWeight: '900',
    color: BANKRUPTCY_UI.colors.border, // Red title
    letterSpacing: 1.5,
    marginBottom: 8,
    fontFamily: 'Courier New', // Monospace for brutalism
  },

  subtitle: {
    fontSize: 12,
    color: BANKRUPTCY_UI.colors.textSecondary,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  glitch: {
    color: BANKRUPTCY_UI.colors.border,
    textShadowColor: BANKRUPTCY_UI.colors.border,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 0,
  },

  // ===== BODY =====

  body: {
    paddingVertical: 24,
    paddingHorizontal: 24,
    gap: 16,
  },

  bodyText: {
    fontSize: 14,
    color: BANKRUPTCY_UI.colors.text,
    lineHeight: 20,
    fontFamily: 'Courier New',
  },

  balanceWarning: {
    backgroundColor: 'rgba(255, 51, 51, 0.1)', // Red tint
    borderLeftWidth: 3,
    borderLeftColor: BANKRUPTCY_UI.colors.border,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginVertical: 8,
  },

  balanceLabel: {
    fontSize: 11,
    color: BANKRUPTCY_UI.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },

  balanceAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: BANKRUPTCY_UI.colors.border,
    marginBottom: 4,
  },

  balanceHint: {
    fontSize: 11,
    color: BANKRUPTCY_UI.colors.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },

  warningBox: {
    backgroundColor: 'rgba(255, 51, 51, 0.05)',
    borderWidth: 1,
    borderColor: BANKRUPTCY_UI.colors.border,
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  warningIcon: {
    fontSize: 20,
  },

  warningText: {
    flex: 1,
    fontSize: 12,
    color: BANKRUPTCY_UI.colors.text,
    lineHeight: 16,
  },

  // ===== BUTTONS =====

  buttonContainer: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BANKRUPTCY_UI.colors.border,
  },

  primaryButton: {
    backgroundColor: BANKRUPTCY_UI.colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  holdButton: {
    position: 'relative',
    overflow: 'hidden',
  },

  progressRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    backgroundColor: BANKRUPTCY_UI.colors.buttonDestructive,
    opacity: 0.2,
    zIndex: 0,
  },

  holdButtonInner: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },

  holdButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: BANKRUPTCY_UI.colors.buttonDestructive,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  progressIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 51, 51, 0.3)',
    overflow: 'hidden',
  },

  progressFill: {
    height: '100%',
    backgroundColor: BANKRUPTCY_UI.colors.buttonDestructive,
  },

  // ===== FOOTER =====

  footer: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: BANKRUPTCY_UI.colors.border,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },

  footerText: {
    fontSize: 11,
    color: BANKRUPTCY_UI.colors.textSecondary,
    lineHeight: 14,
    fontStyle: 'italic',
  },
});
