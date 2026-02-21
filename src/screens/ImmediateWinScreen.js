// src/screens/ImmediateWinScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.6;

export default function ImmediateWinScreen({ navigation }) {
  const { isDarkMode, colors } = useTheme();
  const { calmPoints, setCalmPoints, userProfile, setUserProfile, setWeek1SetupDone } = useContext(AppContext);

  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathState, setBreathState] = useState('ready'); // 'ready', 'inhale', 'hold', 'exhale', 'complete'
  const [showCelebration, setShowCelebration] = useState(false);

  const [scaleAnim] = useState(new Animated.Value(0.7));
  const [opacityAnim] = useState(new Animated.Value(1));
  const [confettiAnim] = useState(new Animated.Value(0));

  const totalBreaths = 3;

  useEffect(() => {
    if (isBreathing && breathState !== 'complete') {
      animateBreath();
    }
  }, [isBreathing, breathState]);

  const animateBreath = () => {
    if (breathState === 'inhale') {
      // Inhale: Scale up (4 seconds)
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true
      }).start(() => {
        setBreathState('hold');
      });
    } else if (breathState === 'hold') {
      // Hold (1 second)
      setTimeout(() => {
        setBreathState('exhale');
      }, 1000);
    } else if (breathState === 'exhale') {
      // Exhale: Scale down (4 seconds)
      Animated.timing(scaleAnim, {
        toValue: 0.7,
        duration: 4000,
        useNativeDriver: true
      }).start(() => {
        const newCount = breathCount + 1;
        setBreathCount(newCount);

        if (newCount >= totalBreaths) {
          setBreathState('complete');
          handleComplete();
        } else {
          setBreathState('inhale');
        }
      });
    }
  };

  const handleStart = () => {
    setIsBreathing(true);
    setBreathState('inhale');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleComplete = async () => {
    setShowCelebration(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Don't award calm points for initial onboarding breathing exercise
    // New users should start at 0 calm points
    // const BREATHING_POINTS = 10;
    // setCalmPoints(calmPoints + BREATHING_POINTS);

    // Animate confetti
    Animated.sequence([
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        delay: 1000,
        useNativeDriver: true
      })
    ]).start();

    // Mark onboarding as completed
    const updatedProfile = {
      ...userProfile,
      onboardingCompleted: true
    };
    await setUserProfile(updatedProfile);

    // Also mark week1 setup as done
    await setWeek1SetupDone(true);

    // Navigate to main app after celebration
    setTimeout(() => {
      navigation.replace('Main');
    }, 2500);
  };

  const getBreathInstructions = () => {
    switch (breathState) {
      case 'ready':
        return 'Press the circle when ready';
      case 'inhale':
        return 'Breathe In...';
      case 'hold':
        return 'Hold...';
      case 'exhale':
        return 'Breathe Out...';
      case 'complete':
        return 'Perfect! 🎉';
      default:
        return '';
    }
  };

  const styles = getStyles(isDarkMode, colors);

  return (
    <View style={styles.container}>
      {!showCelebration ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Before We Start...</Text>
            <Text style={styles.headerSubtitle}>
              Let's take a moment to center yourself
            </Text>
          </View>

          {/* Breathing Circle */}
          <View style={styles.breathingContainer}>
            <TouchableOpacity
              style={styles.circleContainer}
              onPress={breathState === 'ready' ? handleStart : null}
              activeOpacity={0.8}
              disabled={isBreathing}
            >
              <Animated.View
                style={[
                  styles.breathingCircle,
                  {
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <Text style={styles.breathCount}>
                  {breathCount}/{totalBreaths}
                </Text>
              </Animated.View>
            </TouchableOpacity>

            <Text style={styles.breathInstruction}>
              {getBreathInstructions()}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Take 3 deep breaths to activate your parasympathetic nervous system
            </Text>
          </View>
        </>
      ) : (
        /* Celebration Screen */
        <Animated.View
          style={[
            styles.celebrationContainer,
            { opacity: opacityAnim }
          ]}
        >
          <Animated.Text
            style={[
              styles.celebrationEmoji,
              {
                transform: [{
                  translateY: confettiAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0]
                  })
                }]
              }
            ]}
          >
            ✨
          </Animated.Text>

          <Text style={styles.celebrationTitle}>Perfect Start!</Text>
          <Text style={styles.celebrationSubtitle}>
            You're all set!
          </Text>
          <Text style={styles.celebrationMessage}>
            You're ready to begin your journey
          </Text>

          {/* Confetti elements */}
          {['🎉', '✨', '🌟', '💫', '⭐'].map((emoji, index) => (
            <Animated.Text
              key={index}
              style={[
                styles.confettiEmoji,
                {
                  left: `${20 + index * 15}%`,
                  transform: [{
                    translateY: confettiAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-50, 200]
                    })
                  }]
                }
              ]}
            >
              {emoji}
            </Animated.Text>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const getStyles = (isDarkMode, colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  header: {
    alignItems: 'center',
    marginBottom: 60
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  breathingContainer: {
    alignItems: 'center',
    marginBottom: 60
  },
  circleContainer: {
    marginBottom: 40
  },
  breathingCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8
  },
  breathCount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFF'
  },
  breathInstruction: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center'
  },
  infoContainer: {
    paddingHorizontal: 32
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22
  },
  celebrationContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 24
  },
  celebrationTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  celebrationSubtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 16,
    textAlign: 'center'
  },
  celebrationMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  confettiEmoji: {
    position: 'absolute',
    fontSize: 32,
    top: 100
  }
});
