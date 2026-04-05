import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CIRCLE_MIN_SIZE = 80;
const CIRCLE_MAX_SIZE = 200;
const BREATHING_CYCLE_DURATION = 16000; // 4+4+4+4 = 16 seconds per cycle
const TOTAL_DURATION = 60000; // 60 seconds
const PHASES = {
  INHALE: { duration: 4000, label: 'Inhale' },
  HOLD_INHALE: { duration: 4000, label: 'Hold' },
  EXHALE: { duration: 4000, label: 'Exhale' },
  HOLD_EXHALE: { duration: 4000, label: 'Hold' },
};

export default function VagusGatekeeper({ onComplete, onCancel, isVisible = true }) {
  const { isDarkMode, colors } = useTheme();
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isCompleted, isCompletedState] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('INHALE');

  const circleScale = useRef(new Animated.Value(1)).current;
  const timerIntervalRef = useRef(null);
  const phaseTimeoutRef = useRef(null);
  const cycleStartTimeRef = useRef(Date.now());

  const styles = getStyles(isDarkMode, colors);

  // Initialize breathing animation on mount
  useEffect(() => {
    cycleStartTimeRef.current = Date.now();
    startBreathingCycle();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (phaseTimeoutRef.current) clearTimeout(phaseTimeoutRef.current);
    };
  }, []);

  // Count down timer
  useEffect(() => {
    timerIntervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          isCompletedState(true);
          triggerCompletionHaptic();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  // Breathing animation cycle
  const startBreathingCycle = () => {
    const phases = [
      { phase: 'INHALE', duration: 4000, animate: 1.5 },
      { phase: 'HOLD_INHALE', duration: 4000, animate: 1.5 },
      { phase: 'EXHALE', duration: 4000, animate: 0.5 },
      { phase: 'HOLD_EXHALE', duration: 4000, animate: 0.5 },
    ];

    let currentIndex = 0;

    const runPhase = () => {
      if (secondsRemaining <= 0) return;

      const phaseData = phases[currentIndex];
      setCurrentPhase(phaseData.phase);

      // Animate circle
      Animated.timing(circleScale, {
        toValue: phaseData.animate,
        duration: phaseData.duration,
        useNativeDriver: true,
      }).start();

      // Trigger haptics at key points
      if (phaseData.phase === 'INHALE') {
        setTimeout(() => triggerInhaleHaptic(), 3500); // At peak of inhale
      } else if (phaseData.phase === 'EXHALE') {
        setTimeout(() => triggerExhaleHaptic(), 3500); // At bottom of exhale
      }

      // Schedule next phase
      phaseTimeoutRef.current = setTimeout(() => {
        currentIndex = (currentIndex + 1) % phases.length;
        runPhase();
      }, phaseData.duration);
    };

    runPhase();
  };

  const triggerInhaleHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.warn('Haptic feedback unavailable:', e);
    }
  };

  const triggerExhaleHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.warn('Haptic feedback unavailable:', e);
    }
  };

  const triggerCompletionHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn('Haptic feedback unavailable:', e);
    }
  };

  const handleUnlock = () => {
    if (isCompleted && onComplete) {
      onComplete();
    }
  };

  const handleClose = () => {
    // Reset timer and call cancellation callback
    setSecondsRemaining(60);
    isCompletedState(false);
    circleScale.setValue(1);
    cycleStartTimeRef.current = Date.now();
    if (onCancel) {
      onCancel();
    } else {
      // Fallback: restart breathing cycle if no cancel callback
      startBreathingCycle();
    }
  };

  const circleSize = circleScale.interpolate({
    inputRange: [0.5, 1.5],
    outputRange: [CIRCLE_MIN_SIZE, CIRCLE_MAX_SIZE],
  });

  return (
    <Modal
      visible={isVisible && !isCompleted}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Return to Center</Text>
          <Text style={styles.headerSubtitle}>
            Complete the breathing exercise
          </Text>
        </View>

        {/* Breathing Circle */}
        <View style={styles.breathingContainer}>
          <Animated.View
            style={[
              styles.circle,
              {
                width: circleSize,
                height: circleSize,
                borderRadius: circleSize,
              },
            ]}
          />

          {/* Phase Label */}
          <View style={styles.phaseOverlay}>
            <Text style={styles.phaseLabel}>{currentPhase.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Timer */}
        <View style={styles.timerSection}>
          <Text style={styles.timerText}>{secondsRemaining}s</Text>
          <Text style={styles.timerSubtext}>Restore parasympathetic balance</Text>
        </View>

        {/* Completion State */}
        {isCompleted && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionText}>
              Parasympathetic State Reached.
            </Text>
            <Text style={styles.completionSubtext}>You are calm.</Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleClose}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>Stay Calm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.unlockButton}
                onPress={handleUnlock}
                activeOpacity={0.8}
              >
                <Text style={styles.unlockButtonText}>Still Proceed →</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.reflectionText}>
              Do you still want to access this app?
            </Text>
          </View>
        )}

        {/* Info Text */}
        {!isCompleted && (
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              🧠 <Text style={styles.infoBold}>Box Breathing:</Text> A clinical
              technique to stabilize your nervous system before accessing blocked
              content.
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (isDarkMode, colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      marginTop: 20,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    breathingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    circle: {
      backgroundColor: colors.accent,
      opacity: 0.8,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6,
      shadowRadius: 20,
      elevation: 10,
    },
    phaseOverlay: {
      position: 'absolute',
      justifyContent: 'center',
      alignItems: 'center',
    },
    phaseLabel: {
      fontSize: 18,
      fontWeight: '600',
      color: isDarkMode ? '#FFF' : '#000',
      textAlign: 'center',
    },
    timerSection: {
      alignItems: 'center',
      marginVertical: 20,
    },
    timerText: {
      fontSize: 48,
      fontWeight: '700',
      color: colors.accent,
      marginBottom: 4,
    },
    timerSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    completionContainer: {
      backgroundColor: isDarkMode
        ? 'rgba(59, 130, 246, 0.1)'
        : 'rgba(59, 130, 246, 0.05)',
      borderRadius: 16,
      padding: 24,
      borderWidth: 2,
      borderColor: colors.accent,
      alignItems: 'center',
      marginVertical: 20,
    },
    completionText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    completionSubtext: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 16,
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    backButton: {
      flex: 1,
      backgroundColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    unlockButton: {
      flex: 1,
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    unlockButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#FFF',
    },
    reflectionText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    infoSection: {
      backgroundColor: isDarkMode
        ? 'rgba(255, 255, 255, 0.05)'
        : 'rgba(0, 0, 0, 0.02)',
      borderRadius: 12,
      padding: 16,
      marginTop: 20,
    },
    infoText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    infoBold: {
      fontWeight: '700',
      color: colors.text,
    },
  });
