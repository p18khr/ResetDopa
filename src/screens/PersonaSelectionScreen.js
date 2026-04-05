// src/screens/PersonaSelectionScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Persona data structure
const PERSONAS = [
  {
    id: 'student',
    title: 'The Student 📚',
    desc: 'Protect study hours. Build extreme mental endurance to outscore the competition.'
  },
  {
    id: 'professional',
    title: 'The Professional 💼',
    desc: 'Maximize your daily output. Eliminate context-switching and dominate your workday.'
  },
  {
    id: 'minimalist',
    title: 'The Minimalist 🧘',
    desc: 'Strip away the digital noise. Reclaim your attention for real life and mental clarity.'
  }
];

export default function PersonaSelectionScreen({ navigation }) {
  const { isDarkMode, colors } = useTheme();
  const { userProfile, setUserProfile } = useContext(AppContext);

  const [selectedPersona, setSelectedPersona] = useState(null);

  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona);
  };

  const handleContinue = async () => {
    if (!selectedPersona) return;

    // Update user profile with selected persona
    const updatedProfile = {
      ...userProfile,
      userPersona: selectedPersona.id
    };

    await setUserProfile(updatedProfile);

    // Navigate to Diagnostic Question 1
    navigation.navigate('Diagnostic');
  };

  const styles = getStyles(isDarkMode, colors);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Your Cognitive Objective.</Text>
          <Text style={styles.subtitle}>
            This calibrates your AI dashboard and strictness.
          </Text>
        </View>

        {/* Persona Cards */}
        <View style={styles.cardsContainer}>
          {PERSONAS.map((persona) => {
            const isSelected = selectedPersona?.id === persona.id;

            return (
              <TouchableOpacity
                key={persona.id}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected
                ]}
                onPress={() => handleSelectPersona(persona)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.cardTitle,
                    isSelected && styles.cardTitleSelected
                  ]}>
                    {persona.title}
                  </Text>
                  <Text style={[
                    styles.cardDesc,
                    isSelected && styles.cardDescSelected
                  ]}>
                    {persona.desc}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {isSelected && (
                  <View style={styles.selectedIndicator}>
                    <View style={styles.selectedDot} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedPersona && styles.continueButtonDisabled
          ]}
          onPress={handleContinue}
          disabled={!selectedPersona}
          activeOpacity={0.9}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedPersona && styles.continueButtonTextDisabled
          ]}>
            Lock In Identity →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (isDarkMode, colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: colors.surfacePrimary,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    minHeight: 120,
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  cardTitleSelected: {
    color: colors.accent,
  },
  cardDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardDescSelected: {
    color: colors.text,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFF',
  },
  footer: {
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    height: 56,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  continueButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
