// src/components/LegalAcceptanceModal.js
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../constants/legalContent';

export default function LegalAcceptanceModal({ visible, onAccept, onDecline }) {
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
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={32} color="#4A90E2" />
            <Text style={styles.title}>Terms & Privacy Policy</Text>
            <Text style={styles.subtitle}>Please read both documents</Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'terms' && styles.tabActive]}
              onPress={() => setActiveTab('terms')}
            >
              <Text style={[styles.tabText, activeTab === 'terms' && styles.tabTextActive]}>
                Terms of Service
              </Text>
              {termsScrolled && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={styles.tabCheck} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'privacy' && styles.tabActive]}
              onPress={() => setActiveTab('privacy')}
            >
              <Text style={[styles.tabText, activeTab === 'privacy' && styles.tabTextActive]}>
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
            <Text style={styles.contentText}>
              {activeTab === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY}
            </Text>
            <View style={styles.spacer} />
          </ScrollView>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressItem}>
              <Ionicons 
                name={termsScrolled ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={termsScrolled ? "#10B981" : "#D1D5DB"} 
              />
              <Text style={[styles.progressText, termsScrolled && styles.progressTextDone]}>
                Terms of Service
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Ionicons 
                name={privacyScrolled ? "checkmark-circle" : "ellipse-outline"} 
                size={20} 
                color={privacyScrolled ? "#10B981" : "#D1D5DB"} 
              />
              <Text style={[styles.progressText, privacyScrolled && styles.progressTextDone]}>
                Privacy Policy
              </Text>
            </View>
          </View>

          {/* Instructions */}
          {!bothScrolled && (
            <View style={styles.instructionBanner}>
              <Ionicons name="information-circle" size={18} color="#4A90E2" />
              <Text style={styles.instructionText}>
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
    backgroundColor: '#FFFFFF',
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
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
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
  tabActive: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#4A90E2',
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
    color: '#374151',
  },
  spacer: {
    height: 20,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F0F4FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  progressText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#6B7280',
  },
  progressTextDone: {
    color: '#10B981',
    fontWeight: '600',
  },
  instructionBanner: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  instructionText: {
    marginLeft: 10,
    fontSize: 13,
    color: '#1E40AF',
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
