// src/components/DailyMoodCheck.js
import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { MOOD_OPTIONS } from '../constants/moodTaskPools';

export default function DailyMoodCheck({ visible, onMoodSelect, onSkip }) {
  const { isDarkMode, colors } = useTheme();
  const { logMood } = useContext(AppContext);

  // Debug logging
  if (__DEV__ && visible) {
    console.log('[DailyMoodCheck] Modal visible');
    console.log('[DailyMoodCheck] MOOD_OPTIONS length:', MOOD_OPTIONS?.length);
    console.log('[DailyMoodCheck] colors:', colors);
    console.log('[DailyMoodCheck] isDarkMode:', isDarkMode);
  }

  // Safety check: Ensure colors has required properties
  if (!colors || !colors.background || !colors.text) {
    console.error('[DailyMoodCheck] Invalid colors object:', colors);
    return null;
  }

  const handleSelectMood = async (moodId) => {
    if (__DEV__) console.log('[DailyMoodCheck] Selected mood:', moodId);
    // Log mood with context
    await logMood(moodId);

    // Notify parent component
    if (onMoodSelect) {
      onMoodSelect(moodId);
    }
  };

  const handleSkip = () => {
    if (__DEV__) console.log('[DailyMoodCheck] Skipped');
    if (onSkip) {
      onSkip();
    }
  };

  const styles = getStyles(isDarkMode, colors);

  if (!MOOD_OPTIONS || MOOD_OPTIONS.length === 0) {
    console.error('[DailyMoodCheck] MOOD_OPTIONS is empty or undefined!');
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>How are you feeling?</Text>
              <Text style={styles.subtitle}>
                We'll adapt your tasks to match your current state
              </Text>
            </View>

            {/* Mood Options */}
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.moodGrid}>
                {MOOD_OPTIONS.map((mood) => (
                  <TouchableOpacity
                    key={mood.id}
                    style={[
                      styles.moodCard,
                      { borderColor: mood.color }
                    ]}
                    onPress={() => handleSelectMood(mood.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                    <Text style={styles.moodLabel}>{mood.label}</Text>
                    <Text style={styles.moodDescription}>{mood.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Skip Button */}
            <View style={styles.skipContainer}>
              <TouchableOpacity
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipButtonText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const getStyles = (isDarkMode, colors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  safeArea: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    width: '100%'
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  moodCard: {
    width: '48%',
    backgroundColor: isDarkMode ? colors.surfacePrimary : '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    minHeight: 140,
    marginBottom: 12
  },
  moodEmoji: {
    fontSize: 40,
    marginBottom: 8
  },
  moodLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center'
  },
  moodDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16
  },
  skipContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background
  },
  skipButton: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 8
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary
  }
});
