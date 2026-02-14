// src/components/LegalAcceptanceModal.js
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../constants/legalContent';
import { useTheme } from '../context/ThemeContext';

export default function LegalAcceptanceModal({ visible, onAccept, onDecline }) {
  const { isDarkMode, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('terms'); // 'terms' or 'privacy'
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [privacyScrolled, setPrivacyScrolled] = useState(false);

  const handleTermsScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isAtBottom) setTermsScrolled(true);
  };

  const handlePrivacyScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
    if (isAtBottom) setPrivacyScrolled(true);
  };

  const bothScrolled = termsScrolled && privacyScrolled;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={32} color={colors.accent} />
            <Text style={[styles.title, { color: colors.text }]}>Terms & Privacy Policy</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Please read both documents</Text>
          </View>

          {/* Tabs */}
          <View style={[styles.tabContainer, { borderBottomColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'terms' && { borderBottomColor: colors.accent }]}
              onPress={() => setActiveTab('terms')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'terms' && { color: colors.accent }]}>
                Terms of Service
              </Text>
              {termsScrolled && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.tabCheck} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'privacy' && { borderBottomColor: colors.accent }]}
              onPress={() => setActiveTab('privacy')}
            >
              <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'privacy' && { color: colors.accent }]}>
                Privacy Policy
              </Text>
              {privacyScrolled && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.tabCheck} />
              )}
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            onScroll={activeTab === 'terms' ? handleTermsScroll : handlePrivacyScroll}
            scrollEventThrottle={400}
          >
            <Text style={[styles.contentText, { color: colors.textSecondary }]}>
              {activeTab === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY}
            </Text>
            <View style={styles.spacer} />
          </ScrollView>

          {/* Progress indicator */}
          <View style={[styles.progressContainer, { backgroundColor: colors.surfaceSecondary, borderTopColor: colors.border }]}>
            <View style={styles.progressItem}>
              <Ionicons
                name={termsScrolled ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={termsScrolled ? "#10B981" : colors.textTertiary}
              />
              <Text style={[styles.progressText, { color: colors.textSecondary }, termsScrolled && styles.progressTextDone]}>
                Terms of Service
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Ionicons
                name={privacyScrolled ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={privacyScrolled ? "#10B981" : colors.textTertiary}
              />
              <Text style={[styles.progressText, { color: colors.textSecondary }, privacyScrolled && styles.progressTextDone]}>
                Privacy Policy
              </Text>
            </View>
          </View>

          {/* Instructions */}
          {!bothScrolled && (
            <View style={[styles.instructionBanner, { backgroundColor: colors.surfaceSecondary }]}>
              <Ionicons name="information-circle" size={18} color={colors.accent} />
              <Text style={[styles.instructionText, { color: colors.accent }]}>
                Please read the documents to continue
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.declineBtn]}
              onPress={onDecline}
            >
              <Text style={styles.declineBtnText}>Decline & Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={!bothScrolled}
              style={[
                styles.button,
                styles.acceptBtn,
                !bothScrolled && styles.acceptBtnDisabled,
              ]}
              onPress={onAccept}
            >
              <Text style={[styles.acceptBtnText, !bothScrolled && styles.acceptBtnTextDisabled]}>
                I Accept & Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modal: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabCheck: {
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  contentText: {
    fontSize: 14,
    lineHeight: 22,
  },
  spacer: {
    height: 20,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 13,
  },
  progressTextDone: {
    color: '#10B981',
    fontWeight: '600',
  },
  instructionBanner: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  instructionText: {
    marginLeft: 10,
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtn: {
    backgroundColor: '#EF4444',
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptBtn: {
    backgroundColor: '#10B981',
  },
  acceptBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptBtnTextDisabled: {
    color: '#9CA3AF',
  },
});
