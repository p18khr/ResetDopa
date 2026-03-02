import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const STRETCHES = [
  {
    id: 1,
    name: 'Neck Roll',
    description: 'Slow circular motion of the neck',
    duration: '30 seconds each direction',
    emoji: '🔀',
  },
  {
    id: 2,
    name: 'Shoulder Shrug',
    description: 'Lift shoulders to ears, hold 1 sec, release',
    duration: '10-15 reps',
    emoji: '🤷',
  },
  {
    id: 3,
    name: 'Arm Circles',
    description: 'Extend arms, make small then large circles',
    duration: '15 circles each direction',
    emoji: '💨',
  },
  {
    id: 4,
    name: 'Forward Fold',
    description: 'Bend forward at hips, let arms hang',
    duration: 'Hold 30 seconds',
    emoji: '🙇',
  },
  {
    id: 5,
    name: 'Child\'s Pose',
    description: 'Knees wide, bring chest to thighs',
    duration: 'Hold 1 minute',
    emoji: '🧘',
  },
  {
    id: 6,
    name: 'Quad Stretch',
    description: 'Pull foot toward glute, standing or lying',
    duration: '30 sec per leg',
    emoji: '🦵',
  },
];

/**
 * StretchingCarousel - Swipeable stretching guide
 * Pure UI component - does NOT affect task completion
 */
export default function StretchingCarousel({ isVisible, onClose }) {
  const { isDarkMode, colors } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  if (!isVisible) {
    return null;
  }

  const currentStretch = STRETCHES[currentIndex];

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
        {/* Large Emoji */}
        <Text style={styles.largeEmoji}>{currentStretch.emoji}</Text>

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
          <Text style={[styles.duration, { color: colors.accent }]}>{currentStretch.duration}</Text>
        </View>

        {/* Tips */}
        <View style={[styles.tipsBox, { backgroundColor: colors.surfacePrimary }]}>
          <Text style={[styles.tipsLabel, { color: colors.textSecondary }]}>💡 Pro Tip:</Text>
          <Text style={[styles.tips, { color: colors.text }]}>
            Breathe deeply. Never bounce into stretches. Hold steady without pain.
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Navigation */}
      <View style={[styles.footer, { backgroundColor: colors.surfacePrimary, borderTopColor: colors.border }]}>
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

          <Text style={[styles.counter, { color: colors.textSecondary }]}>
            {currentIndex + 1} / {STRETCHES.length}
          </Text>

          <TouchableOpacity
            style={[
              styles.navButton,
              { backgroundColor: currentIndex < STRETCHES.length - 1 ? colors.accent : colors.success },
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
  largeEmoji: {
    fontSize: 64,
    marginBottom: 16,
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
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
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
    justifyContent: 'space-between',
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
  counter: {
    fontSize: 12,
    fontWeight: '600',
  },
});
