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
  if (__DEV__) {
    console.log('[DailyMoodCheck] Component function called with visible=', visible);
    console.log('[DailyMoodCheck] colors object:', colors);
    console.log('[DailyMoodCheck] isDarkMode:', isDarkMode);
  }

  if (__DEV__ && visible) {
    console.log('[DailyMoodCheck] Modal is VISIBLE');
    console.log('[DailyMoodCheck] MOOD_OPTIONS length:', MOOD_OPTIONS?.length);
    console.log('[DailyMoodCheck] colors properties:', {
      background: colors?.background,
      text: colors?.text,
      surfacePrimary: colors?.surfacePrimary,
    });
  }

  // Safety check: Provide fallback colors if needed
  const safeColors = colors || {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    surfacePrimary: '#F3F4F6',
  };

  if (__DEV__) {
    if (!colors) {
      console.warn('[DailyMoodCheck] useTheme returned null/undefined, using fallback colors');
    }
  }

  if (!MOOD_OPTIONS || MOOD_OPTIONS.length === 0) {
    console.error('[DailyMoodCheck] MOOD_OPTIONS is empty or undefined!');
    return null;
  }

  const getStyles = (isDarkMode, colors) => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end'
    },
    modalContainer: {
      width: '100%',
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
      paddingBottom: 20
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
      maxHeight: 500
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

  const handleSelectMood = async (moodId) => {
    try {
      if (__DEV__) console.log('[DailyMoodCheck] Selected mood:', moodId);

      // Log mood with context
      await logMood(moodId);
      if (__DEV__) console.log('[DailyMoodCheck] Mood logged successfully');

      // Notify parent component
      if (onMoodSelect) {
        onMoodSelect(moodId);
      }
    } catch (error) {
      console.error('[DailyMoodCheck] Error logging mood:', error?.message || error);
      // Still notify parent to prevent modal from getting stuck
      if (onMoodSelect) {
        onMoodSelect(moodId);
      }
    }
  };

  const handleSkip = () => {
    if (__DEV__) console.log('[DailyMoodCheck] Skipped');
    if (onSkip) {
      onSkip();
    }
  };

  const styles = getStyles(isDarkMode, safeColors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
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
      </View>
    </Modal>
  );
}
