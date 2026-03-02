import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { generateBreathworkGuide, MEDITATION_SOUNDS, playSuccessSound } from '../utils/audioUtils';
import BreathingBall from './BreathingBall';

/**
 * TaskGuideModal - Display breathwork/meditation guides
 * Pure UI component - does NOT affect task completion, streak, or points
 */
export default function TaskGuideModal({
  isVisible,
  onClose,
  taskName,
  guideType = 'breathwork', // 'breathwork' | 'meditation' | 'stretching'
  duration = 5,
}) {
  const { isDarkMode, colors } = useTheme();
  const [selectedSound, setSelectedSound] = useState('silence');
  const [isStarted, setIsStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(duration * 60); // seconds

  // Reset timer when modal opens
  useEffect(() => {
    if (isVisible) {
      setIsStarted(false);
      setTimeRemaining(duration * 60);
    }
  }, [isVisible, duration]);

  // Timer effect - independent of task completion
  useEffect(() => {
    if (!isStarted || !isVisible) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsStarted(false);
          playSuccessSound();
          return duration * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isStarted, isVisible, duration]);

  const breathworkGuide = generateBreathworkGuide(duration);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const renderBreathworkContent = () => (
    <View style={styles.contentScroll}>
      <BreathingBall isActive={isStarted} color={colors.accent} />

      {isStarted && (
        <View style={[styles.timerBox, { backgroundColor: colors.surfacePrimary }]}>
          <Text style={[styles.timerText, { color: colors.text }]}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
          <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
            Time remaining
          </Text>
        </View>
      )}

      {!isStarted && (
        <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
          <Text style={[styles.guideText, { color: colors.text }]}>
            Follow the expanding and contracting circle. Breathe naturally with the rhythm:
          </Text>
          <Text style={[styles.breathPattern, { color: colors.textSecondary }]}>
            • Inhale for 4 counts (circle expands)
            {'\n'}• Hold for 2 counts (circle pauses)
            {'\n'}• Exhale for 4 counts (circle contracts)
            {'\n'}• Pause for 2 counts
          </Text>
        </View>
      )}
    </View>
  );

  const renderMeditationContent = () => (
    <ScrollView style={styles.contentScroll}>
      {!isStarted ? (
        <>
          <Text style={[styles.intro, { color: colors.text }]}>
            Select a background sound and then press Start
          </Text>

          <Text style={[styles.soundTitle, { color: colors.text }]}>Background Sound</Text>
          {Object.entries(MEDITATION_SOUNDS).map(([key, sound]) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.soundOption,
                { backgroundColor: colors.surfacePrimary, borderColor: colors.border },
                selectedSound === key && { backgroundColor: colors.accent },
              ]}
              onPress={() => setSelectedSound(key)}
            >
              <Text style={[styles.soundEmoji]}>{sound.emoji}</Text>
              <View>
                <Text style={[styles.soundName, { color: colors.text }]}>{sound.name}</Text>
                <Text style={[styles.soundDesc, { color: colors.textSecondary }]}>
                  {sound.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <Text style={[styles.meditationStatusText, { color: colors.accent }]}>
            {MEDITATION_SOUNDS[selectedSound].emoji}
          </Text>
          <Text style={[styles.meditationStatusLabel, { color: colors.text }]}>
            {MEDITATION_SOUNDS[selectedSound].name}
          </Text>
          <Text style={[styles.meditationStatusDesc, { color: colors.textSecondary }]}>
            Meditating...
          </Text>

          <View style={[styles.timerBox, { backgroundColor: colors.surfacePrimary, marginTop: 30 }]}>
            <Text style={[styles.timerText, { color: colors.text }]}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </Text>
            <Text style={[styles.timerLabel, { color: colors.textSecondary }]}>
              Time remaining
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surfacePrimary, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {guideType === 'breathwork' ? '🫁 Breathwork Guide' : '🧘 Meditation'}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.accent }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {guideType === 'breathwork' ? renderBreathworkContent() : renderMeditationContent()}

        {/* Action Buttons */}
        <View style={[styles.footer, { backgroundColor: colors.surfacePrimary, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={() => setIsStarted(!isStarted)}
          >
            <Text style={[styles.buttonText, { color: '#FFF' }]}>
              {isStarted ? '⏸ Pause' : '▶ Start'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => {
              setIsStarted(false);
              setTimeRemaining(duration * 60);
            }}
          >
            <Text style={[styles.buttonText, { color: colors.text }]}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.success }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: '#FFF' }]}>Done</Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: '500',
  },
  outro: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 20,
    fontStyle: 'italic',
  },
  timerBox: {
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 16,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Menlo',
  },
  timerLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  guideText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '500',
  },
  breathPattern: {
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
  meditationStatusText: {
    fontSize: 64,
    marginBottom: 16,
  },
  meditationStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  meditationStatusDesc: {
    fontSize: 13,
  },
  cycleBox: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cycleNumber: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  cycleStep: {
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 4,
  },
  soundTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  soundOption: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  soundEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  soundName: {
    fontSize: 14,
    fontWeight: '600',
  },
  soundDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
