// src/screens/BundleRecommendationScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { getAllBundles } from '../constants/taskBundles';
import { TASK_METADATA } from '../utils/programData';

export default function BundleRecommendationScreen({ route, navigation }) {
  const { isDarkMode, colors } = useTheme();
  const { userProfile, setUserProfile } = useContext(AppContext);

  const { bundle: initialBundle, answers } = route.params;
  const [selectedBundle, setSelectedBundle] = useState(initialBundle);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const allBundles = getAllBundles();

  const handleAcceptBundle = async () => {
    // Save core habits to user profile
    const updatedProfile = {
      ...userProfile,
      coreHabits: selectedBundle.tasks,
      diagnosticAnswers: answers,
      recommendedBundleId: selectedBundle.id
    };

    await setUserProfile(updatedProfile);

    // Navigate to immediate win screen
    navigation.navigate('ImmediateWin');
  };

  const handleSelectDifferentBundle = (bundle) => {
    setSelectedBundle(bundle);
    setShowCustomizeModal(false);
  };

  const styles = getStyles(isDarkMode, colors);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.badge}>✨ Personalized For You</Text>
          <Text style={styles.title}>Your Daily Anchors</Text>
          <Text style={styles.subtitle}>
            Based on your goals, these 5 tasks will be your core habits
          </Text>
        </View>

        {/* Bundle Card */}
        <View style={styles.bundleCard}>
          <View style={styles.bundleHeader}>
            <Text style={styles.bundleName}>{selectedBundle.name}</Text>
            <Text style={styles.bundleDescription}>
              {selectedBundle.description}
            </Text>
          </View>

          {/* Tasks List */}
          <View style={styles.tasksList}>
            {selectedBundle.tasks.map((task, index) => {
              const metadata = TASK_METADATA[task] || {};
              const category = metadata.category || '📌';

              return (
                <View key={index} style={styles.taskItem}>
                  <View style={styles.taskCheckbox}>
                    <Text style={styles.taskCheckboxText}>✓</Text>
                  </View>
                  <View style={styles.taskContent}>
                    <Text style={styles.taskTitle}>{task}</Text>
                    <Text style={styles.taskCategory}>{category}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoText}>
              These will be your <Text style={styles.infoTextBold}>core habits</Text> every day.
              You'll also get 2-3 adaptive tasks based on your daily mood.
            </Text>
          </View>
        </View>

        {/* Why These Tasks */}
        <View style={styles.whySection}>
          <Text style={styles.whySectionTitle}>Why these tasks?</Text>
          {selectedBundle.painPoint && (
            <View style={styles.whyItem}>
              <Text style={styles.whyBullet}>•</Text>
              <Text style={styles.whyText}>
                Targeted for {selectedBundle.painPoint.replace('_', ' ')}
              </Text>
            </View>
          )}
          {selectedBundle.tags && (
            <View style={styles.whyItem}>
              <Text style={styles.whyBullet}>•</Text>
              <Text style={styles.whyText}>
                Focuses on: {selectedBundle.tags.join(', ')}
              </Text>
            </View>
          )}
          <View style={styles.whyItem}>
            <Text style={styles.whyBullet}>•</Text>
            <Text style={styles.whyText}>
              Scientifically designed for dopamine regulation
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.customizeButton}
          onPress={() => setShowCustomizeModal(true)}
        >
          <Text style={styles.customizeButtonText}>Choose Different Bundle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAcceptBundle}
        >
          <Text style={styles.acceptButtonText}>Accept & Continue</Text>
        </TouchableOpacity>
      </View>

      {/* Customize Modal */}
      <Modal
        visible={showCustomizeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomizeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Your Bundle</Text>
              <TouchableOpacity
                onPress={() => setShowCustomizeModal(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={allBundles}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedBundle.id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.modalBundleItem,
                      isSelected && styles.modalBundleItemSelected
                    ]}
                    onPress={() => handleSelectDifferentBundle(item)}
                  >
                    <View style={styles.modalBundleHeader}>
                      <Text style={[
                        styles.modalBundleName,
                        isSelected && styles.modalBundleNameSelected
                      ]}>
                        {item.name}
                        {isSelected && ' ✓'}
                      </Text>
                      <Text style={styles.modalBundleDescription}>
                        {item.description}
                      </Text>
                    </View>
                    <Text style={styles.modalBundleTasks}>
                      {item.tasks.length} tasks • {item.tags?.join(', ')}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (isDarkMode, colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60
  },
  header: {
    marginBottom: 24
  },
  badge: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 8
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22
  },
  bundleCard: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: colors.accent
  },
  bundleHeader: {
    marginBottom: 20
  },
  bundleName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4
  },
  bundleDescription: {
    fontSize: 14,
    color: colors.textSecondary
  },
  tasksList: {
    gap: 12,
    marginBottom: 20
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2
  },
  taskCheckboxText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700'
  },
  taskContent: {
    flex: 1
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2
  },
  taskCategory: {
    fontSize: 13,
    color: colors.textSecondary
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  infoIcon: {
    fontSize: 20
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20
  },
  infoTextBold: {
    fontWeight: '700',
    color: colors.text
  },
  whySection: {
    marginBottom: 24
  },
  whySectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
  },
  whyItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8
  },
  whyBullet: {
    fontSize: 16,
    color: colors.accent,
    fontWeight: '700'
  },
  whyText: {
    flex: 1,
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  customizeButton: {
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center'
  },
  customizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text
  },
  acceptButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center'
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCloseText: {
    fontSize: 32,
    color: colors.textSecondary,
    fontWeight: '300',
    lineHeight: 32
  },
  modalList: {
    padding: 24,
    paddingBottom: 40
  },
  modalBundleItem: {
    backgroundColor: colors.surfacePrimary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.border
  },
  modalBundleItemSelected: {
    borderColor: colors.accent,
    backgroundColor: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
  },
  modalBundleHeader: {
    marginBottom: 8
  },
  modalBundleName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4
  },
  modalBundleNameSelected: {
    color: colors.accent
  },
  modalBundleDescription: {
    fontSize: 14,
    color: colors.textSecondary
  },
  modalBundleTasks: {
    fontSize: 13,
    color: colors.textSecondary
  }
});
