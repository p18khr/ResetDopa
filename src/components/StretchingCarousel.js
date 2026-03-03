import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STRETCHES = [
  {
    id: 1,
    name: 'Neck Roll',
    description: 'Slow circular motion of the neck',
    durationText: '30 seconds each direction',
    durationSeconds: 60, // 30 sec * 2 directions
    gifUrl: 'https://media.giphy.com/media/LNLlMyhY3tO0UWAqR0/giphy.gif',
  },
  {
    id: 2,
    name: 'Shoulder Shrug',
    description: 'Lift shoulders to ears, hold 1 sec, release',
    durationText: '10-15 reps',
    durationSeconds: 45, // Approx 3-4 seconds per rep
    gifUrl: 'https://media.giphy.com/media/3o85xIO33l7RlmLjIQ/giphy.gif',
  },
  {
    id: 3,
    name: 'Arm Circles',
    description: 'Extend arms, make small then large circles',
    durationText: '15 circles each direction',
    durationSeconds: 60, // 30 seconds per direction
    gifUrl: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
  },
  {
    id: 4,
    name: 'Forward Fold',
    description: 'Bend forward at hips, let arms hang',
    durationText: 'Hold 30 seconds',
    durationSeconds: 30,
    gifUrl: 'https://media.giphy.com/media/l0HlNaQ9hWt8sJiIo/giphy.gif',
  },
  {
    id: 5,
    name: 'Child\'s Pose',
    description: 'Knees wide, bring chest to thighs',
    durationText: 'Hold 1 minute',
    durationSeconds: 60,
    gifUrl: 'https://media.giphy.com/media/3oh8xyOIvE7sO22idW/giphy.gif',
  },
  {
    id: 6,
    name: 'Quad Stretch',
    description: 'Pull foot toward glute, standing or lying',
    durationText: '30 sec per leg',
    durationSeconds: 60, // 30 sec * 2 legs
    gifUrl: 'https://media.giphy.com/media/l0HlSY9x8FZo0XO1i/giphy.gif',
  },
];

/**
 * StretchingCarousel - Swipeable stretching guide with integrated timer
 * Pure UI component - does NOT affect task completion
 */
export default function StretchingCarousel({ isVisible, onClose }) {
  const { isDarkMode, colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const currentStretch = STRETCHES[currentIndex];

  // Reset timer when exercise changes
  useEffect(() => {
    setIsStarted(false);
    setTimeRemaining(currentStretch.durationSeconds);
  }, [currentIndex, currentStretch.durationSeconds]);

  // Timer effect
  useEffect(() => {
    if (!isStarted || !isVisible) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsStarted(false);
          return currentStretch.durationSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isVisible, currentStretch.durationSeconds]);

  if (!isVisible) {
    return null;
  }

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
        {/* GIF Display */}
        <Image
          source={{ uri: currentStretch.gifUrl }}
          style={styles.gif}
          resizeMode="contain"
          onError={() => console.warn(`Failed to load GIF for ${currentStretch.name}`)}
        />

        {/* Stretch Name */}
        <Text style={[styles.stretchName, { color: colors.text }]}>{currentStretch.name}</Text>

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
            onPress={currentIndex < STRETCHES.length - 1 ? handleNext : onClose}
          >
            <Text style={[styles.navButtonText, { color: '#FFF' }]}>
              {currentIndex < STRETCHES.length - 1 ? 'Next →' : 'Done ✓'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  gif: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
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
