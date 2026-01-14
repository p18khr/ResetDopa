// src/screens/LegalAcceptanceScreen.js
import React, { useContext, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '../constants/legalContent';

export default function LegalAcceptanceScreen() {
  const { acceptTerms } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('terms');
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [privacyScrolled, setPrivacyScrolled] = useState(false);
  const [termsContentHeight, setTermsContentHeight] = useState(0);
  const [privacyContentHeight, setPrivacyContentHeight] = useState(0);
  const termsScrollRef = useRef(null);
  const privacyScrollRef = useRef(null);

  const checkScroll = (event, setScrolled, contentHeight) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Only mark as read if we've reached near the bottom
    // Using 100px tolerance to be forgiving
    const scrollPosition = contentOffset.y + layoutMeasurement.height;
    const totalHeight = contentSize.height;
    const isAtBottom = scrollPosition >= totalHeight - 100;
    
    if (isAtBottom) {
      setScrolled(true);
    }
  };

  const handleTermsScroll = (event) => {
    checkScroll(event, setTermsScrolled, termsContentHeight);
  };

  const handlePrivacyScroll = (event) => {
    checkScroll(event, setPrivacyScrolled, privacyContentHeight);
  };

  const bothScrolled = termsScrolled && privacyScrolled;

  const handleAccept = async () => {
    await acceptTerms();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={40} color="#4A90E2" />
        <Text style={styles.title}>Terms & Privacy Policy</Text>
        <Text style={styles.subtitle}>Please read both documents to continue</Text>
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
            <Ionicons name="checkmark-circle" size={18} color="#10B981" style={styles.tabCheck} />
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
            <Ionicons name="checkmark-circle" size={18} color="#10B981" style={styles.tabCheck} />
          )}
        </TouchableOpacity>
      </View>

      {/* Content - Terms Tab */}
      {activeTab === 'terms' && (
        <ScrollView
          ref={termsScrollRef}
          key="terms-scroll"
          style={styles.content}
          onScroll={handleTermsScroll}
          scrollEventThrottle={100}
          onContentSizeChange={(width, height) => setTermsContentHeight(height)}
        >
          <Text style={styles.contentText}>{TERMS_OF_SERVICE}</Text>
        </ScrollView>
      )}

      {/* Content - Privacy Tab */}
      {activeTab === 'privacy' && (
        <ScrollView
          ref={privacyScrollRef}
          key="privacy-scroll"
          style={styles.content}
          onScroll={handlePrivacyScroll}
          scrollEventThrottle={100}
          onContentSizeChange={(width, height) => setPrivacyContentHeight(height)}
        >
          <Text style={styles.contentText}>{PRIVACY_POLICY}</Text>
        </ScrollView>
      )}

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

      {/* Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          disabled={!bothScrolled}
          style={[
            styles.acceptBtn,
            !bothScrolled && styles.acceptBtnDisabled,
          ]}
          onPress={handleAccept}
        >
          <Text style={[styles.acceptBtnText, !bothScrolled && styles.acceptBtnTextDisabled]}>
            I Accept & Continue
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
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
    paddingVertical: 14,
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
    marginLeft: 8,
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
    paddingVertical: 14,
    backgroundColor: '#F0F4FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  acceptBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  acceptBtnDisabled: {
    backgroundColor: '#D1D5DB',
  },
  acceptBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  acceptBtnTextDisabled: {
    color: '#9CA3AF',
  },
});
