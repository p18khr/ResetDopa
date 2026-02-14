// src/screens/DiagnosticScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { DIAGNOSTIC_QUESTIONS, getBundleForAnswers } from '../constants/taskBundles';

export default function DiagnosticScreen({ navigation }) {
  const { isDarkMode, colors } = useTheme();
  const { userProfile, setUserProfile } = useContext(AppContext);

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({});

  const totalSteps = 2;
  const currentQuestion = currentStep === 1 ? DIAGNOSTIC_QUESTIONS.q1 : DIAGNOSTIC_QUESTIONS.q2;

  const handleSelectOption = (value) => {
    const questionId = `q${currentStep}`;
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleContinue = () => {
    if (currentStep < totalSteps) {
      // Move to next step without animation (animation was causing touch issues)
      setCurrentStep(currentStep + 1);
    } else {
      // Complete diagnostic and navigate to bundle recommendation
      const bundle = getBundleForAnswers(answers.q1, answers.q2);

      // Save answers to user profile
      const updatedProfile = {
        ...userProfile,
        diagnosticAnswers: answers,
        recommendedBundleId: bundle.id
      };
      setUserProfile(updatedProfile);

      // Navigate to bundle recommendation
      navigation.navigate('BundleRecommendation', { bundle, answers });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isOptionSelected = () => {
    return !!answers[`q${currentStep}`];
  };

  const styles = getStyles(isDarkMode, colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Let's Personalize Your Journey</Text>
        <View style={styles.progressContainer}>
          {[...Array(totalSteps)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index + 1 === currentStep && styles.progressDotActive,
                index + 1 < currentStep && styles.progressDotCompleted
              ]}
            />
          ))}
        </View>
        <Text style={styles.stepText}>
          Step {currentStep} of {totalSteps}
        </Text>
      </View>

      {/* Question Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.question}>{currentQuestion.question}</Text>

          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isSelected = answers[`q${currentStep}`] === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected
                  ]}
                  onPress={() => handleSelectOption(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionHeader}>
                    <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    <Text style={[
                      styles.optionLabel,
                      isSelected && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                  </View>
                  <Text style={[
                    styles.optionDescription,
                    isSelected && styles.optionDescriptionSelected
                  ]}>
                    {option.description}
                  </Text>

                  {/* Selection indicator */}
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.continueButton,
            !isOptionSelected() && styles.continueButtonDisabled,
            currentStep === 1 && styles.continueButtonFullWidth
          ]}
          onPress={handleContinue}
          disabled={!isOptionSelected()}
        >
          <Text style={[
            styles.continueButtonText,
            !isOptionSelected() && styles.continueButtonTextDisabled
          ]}>
            {currentStep === totalSteps ? 'See My Plan' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (isDarkMode, colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center'
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border
  },
  progressDotActive: {
    width: 24,
    backgroundColor: colors.primary
  },
  progressDotCompleted: {
    backgroundColor: colors.primary
  },
  stepText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 24
  },
  question: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 24,
    lineHeight: 30
  },
  optionsContainer: {
    gap: 16
  },
  optionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.border
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12
  },
  optionEmoji: {
    fontSize: 28
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1
  },
  optionLabelSelected: {
    color: colors.primary
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: 40
  },
  optionDescriptionSelected: {
    color: colors.text
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedIndicatorText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700'
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  backButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  continueButton: {
    flex: 2,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  continueButtonFullWidth: {
    flex: 1
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
    opacity: 0.5
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF'
  },
  continueButtonTextDisabled: {
    color: colors.textSecondary
  }
});
