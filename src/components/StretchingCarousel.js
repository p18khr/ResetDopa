import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Modal, Animated, Image } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STRETCHES = [
  {
    id: 1,
    name: 'Neck Roll',
    description: 'Slow circular motion of the neck',
    durationText: '30 seconds each direction',
    durationSeconds: 60,
    emoji: '🔄',
    gifUrl: 'https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG1tNWZoNTljcjJzMHB1NXU5dmp5YzA0b2J0YmY0bDhyNmdudHY4ciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/L4XmhbjtQBLapRFMi5/giphy.gif',
    instruction: 'Rotate your head in slow circles, one direction for 30 sec, then reverse',
  },
  {
    id: 2,
    name: 'Shoulder Shrug',
    description: 'Lift shoulders to ears, hold 1 sec, release',
    durationText: '10-15 reps',
    durationSeconds: 45,
    emoji: '⬆️',
    gifUrl: 'https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExaWFzd3NzZHpsdXdyMGcxeWc0enV5OW1sY2llMjJieWVjamNpYmh1YSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/tZHD3LQOrBn0rSMxlk/giphy.gif',
    instruction: 'Pull shoulders up towards ears, hold briefly, then relax. Repeat smoothly.',
  },
  {
    id: 3,
    name: 'Arm Circles',
    description: 'Extend arms, make small then large circles',
    durationText: '15 circles each direction',
    durationSeconds: 60,
    emoji: '⭕',
    gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbXp0bm9zeTg2djBxcjFuZmU0YnJxaDczeGZhZ2xjYXR0dzNrM255eCZlcD12MV9naWZzX3NlYXJjaCZjdD1n/PkoUdJKnL58UHfr4C9/giphy.gif',
    instruction: 'Extend arms out, make 15 small circles forward, then 15 large circles',
  },
  {
    id: 4,
    name: 'Forward Fold',
    description: 'Bend forward at hips, let arms hang',
    durationText: 'Hold 30 seconds',
    durationSeconds: 30,
    emoji: '🙇',
    gifUrl: 'https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExcnUxdjJwYjg0OWk1bjRkcTRhdThoenBqNWMyaW1vNTBlMXo1dXA5byZlcD12MV9naWZzX3NlYXJjaCZjdD1n/7fdmEVa2rwGBQFPoW4/giphy.gif',
    instruction: 'Bend from your hips, let your upper body fold down. Keep legs straight.',
  },
  {
    id: 5,
    name: 'Child\'s Pose',
    description: 'Knees wide, bring chest to thighs',
    durationText: 'Hold 1 minute',
    durationSeconds: 60,
    emoji: '🧘',
    gifUrl: 'https://media4.giphy.com/media/qXHefJkvwzWWLrmpAA/giphy.gif',
    instruction: 'Kneel on ground, sit hips back to heels, stretch arms forward on floor.',
  },
  {
    id: 6,
    name: 'Quad Stretch',
    description: 'Pull foot toward glute, standing or lying',
    durationText: '30 sec per leg',
    durationSeconds: 60,
    emoji: '🦵',
    gifUrl: 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbng3cmFoaGs2a2JmaDkzbnA1NWRobHpxZmNnNm8wMzBmM2NxbTNvdiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/QW9pbiH6LLWEL9Je6g/giphy.gif',
    instruction: 'Pull one foot toward your glute. Hold 30sec per leg. Stay balanced.',
  },
];

/**
 * StretchingCarousel - Swipeable stretching guide with integrated timer
 * Pure UI component - does NOT affect task completion
 */
export default function StretchingCarousel({ isVisible, onClose, onComplete }) {
  const { isDarkMode, colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  // Animation refs for stretching visualizations
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const moveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const currentStretch = STRETCHES[currentIndex];

  // Reset timer when exercise changes
  useEffect(() => {
    setIsStarted(false);
    setTimeRemaining(currentStretch.durationSeconds);
  }, [currentIndex, currentStretch.durationSeconds]);

  // Timer effect with auto-advance
  useEffect(() => {
    if (!isStarted || !isVisible) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsStarted(false);
          // Auto-advance to next exercise
          if (currentIndex < STRETCHES.length - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            // Last exercise done - stay on it but pause
          }
          return currentStretch.durationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isVisible, currentIndex, currentStretch.durationSeconds]);

  // Animate stretching visualizations
  useEffect(() => {
    if (!isStarted) {
      Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      Animated.timing(moveAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      Animated.timing(scaleAnim, { toValue: 1, duration: 0, useNativeDriver: true }).start();
      return;
    }

    if (currentIndex === 0) {
      // Neck Roll - rotation animation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 360,
          duration: 4000,
          useNativeDriver: true,
        })
      ).start();
    } else if (currentIndex === 1) {
      // Shoulder Shrug - up and down
      Animated.loop(
        Animated.sequence([
          Animated.timing(moveAnim, { toValue: -30, duration: 600, useNativeDriver: true }),
          Animated.timing(moveAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else if (currentIndex === 2) {
      // Arm Circles - scale animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.3, duration: 1000, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else if (currentIndex === 3) {
      // Forward Fold - rotation
      Animated.timing(rotateAnim, {
        toValue: 90,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    } else if (currentIndex === 4) {
      // Child's Pose - scale down
      Animated.timing(scaleAnim, {
        toValue: 0.6,
        duration: 2000,
        useNativeDriver: true,
      }).start();
    } else if (currentIndex === 5) {
      // Quad Stretch - rotation
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 45, duration: 1500, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: -45, duration: 1500, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isStarted, currentIndex, rotateAnim, moveAnim, scaleAnim]);

  const handleNext = () => {
    if (currentIndex < STRETCHES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <Modal visible={isVisible} transparent={false} animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surfacePrimary, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>🏃 Stretching Guide</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.accent }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer}>
          {/* Animated Stretch Visualization */}
          <View style={[styles.visualBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Image
              source={{ uri: currentStretch.gifUrl }}
              style={styles.gifImage}
              resizeMode="contain"
            />
          </View>

          {/* Stretch Name */}
          <Text style={[styles.stretchName, { color: colors.text }]}>{currentStretch.name}</Text>

          {/* Instruction Box */}
          <View style={[styles.instructionBox, { backgroundColor: colors.accent, opacity: 0.1 }]}>
            <Text style={[styles.instruction, { color: colors.text }]}>
              📝 {currentStretch.instruction}
            </Text>
          </View>

          {/* Description */}
          <View style={[styles.descBox, { backgroundColor: colors.surfacePrimary }]}>
            <Text style={[styles.descLabel, { color: colors.textSecondary }]}>How to do it:</Text>
            <Text style={[styles.description, { color: colors.text }]}>{currentStretch.description}</Text>
          </View>

          {/* Duration */}
          <View style={[styles.durationBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.durationLabel, { color: colors.textSecondary }]}>Duration:</Text>
            <Text style={[styles.duration, { color: colors.accent }]}>{currentStretch.durationText}</Text>
          </View>

          {/* Tips */}
          <View style={[styles.tipsBox, { backgroundColor: colors.surfacePrimary }]}>
            <Text style={[styles.tipsLabel, { color: colors.textSecondary }]}>💡 Pro Tip:</Text>
            <Text style={[styles.tips, { color: colors.text }]}>
              Breathe deeply. Never bounce into stretches. Hold steady without pain.
            </Text>
          </View>
        </ScrollView>

        {/* Footer with Navigation and Timer */}
        <View style={[styles.footer, { backgroundColor: colors.surfacePrimary, borderTopColor: colors.border }]}>
          {/* Timer */}
          <View style={[styles.timerBox, { backgroundColor: colors.surfaceSecondary }]}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
          </View>

          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {STRETCHES.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentIndex ? colors.accent : colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {/* Navigation Buttons */}
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: currentIndex > 0 ? colors.surfaceSecondary : colors.border },
              ]}
              onPress={handlePrev}
              disabled={currentIndex === 0}
            >
              <Text style={[styles.navButtonText, { color: colors.text }]}>← Prev</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={() => setIsStarted(!isStarted)}
            >
              <Text style={[styles.navButtonText, { color: '#FFF' }]}>
                {isStarted ? '⏸ Pause' : '▶ Start'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.navButton,
                { backgroundColor: currentIndex < STRETCHES.length - 1 ? colors.surfaceSecondary : colors.success },
              ]}
              onPress={currentIndex < STRETCHES.length - 1 ? handleNext : onComplete}
            >
              <Text style={[styles.navButtonText, { color: '#FFF' }]}>
                {currentIndex < STRETCHES.length - 1 ? 'Next →' : 'Done ✓'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginTop: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 24,
    padding: 8,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  visualBox: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  circle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  circleGroup: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  rectangle: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    opacity: 0.8,
  },
  largeEmoji: {
    fontSize: 72,
  },
  instructionBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  instruction: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  stretchName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  descBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  descLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  durationBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  duration: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tipsBox: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  tipsLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  tips: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  timerBox: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Menlo',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  navButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
