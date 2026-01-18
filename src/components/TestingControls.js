// src/components/TestingControls.js
import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

const SUPER_USER_EMAIL = 'prakharpps.18@gmail.com';

export default function TestingControls({ navigation }) {
  const { getCurrentDay, advanceProgramDay, initializeBeginnerState, startDate, getGraceStatus, user, hasAcceptedTerms } = useContext(AppContext);
  const [showGraceDebug, setShowGraceDebug] = useState(false);
  const day = typeof getCurrentDay === 'function' ? getCurrentDay() : 1;
  const graceStatus = getGraceStatus ? getGraceStatus() : null;

  const onAdvanceDay = async () => {
    Alert.alert(
      'Advance Day',
      `Current: Day ${day}. Move to Day ${day + 1}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Advance',
          onPress: async () => {
            try {
              const next = await advanceProgramDay(1);
              Alert.alert('Advanced', `You are now on Day ${next}.`);
            } catch (e) {
              Alert.alert('Error', 'Could not advance the day.');
            }
          },
        },
      ]
    );
  };

  const onStartFresh = async () => {
    Alert.alert(
      'Start Fresh',
      'Reset to Day 1 and show onboarding? Your data stays signed in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await initializeBeginnerState();
              // Ensure first-visit flows are visible
              try {
                await AsyncStorage.removeItem('seen_intro_program');
                await AsyncStorage.removeItem('seen_intro_urges');
                await AsyncStorage.removeItem('seen_intro_stats');
                await AsyncStorage.setItem('program_intro_pending', 'true');
                await AsyncStorage.setItem('beginnerLaunch_v1', 'true');
              } catch {}
              try { navigation?.navigate('Main', { screen: 'Dashboard' }); } catch {}
              Alert.alert('Beginner Mode', 'Welcome! Pick 5 anchors on the Dashboard to begin.');
            } catch (e) {
              Alert.alert('Error', 'Could not reset to Day 1.');
            }
          },
        },
      ]
    );
  };

  const onToggleLegalAcceptance = async () => {
    if (!user) {
      Alert.alert('Not Signed In', 'Sign in to test legal acceptance.');
      return;
    }

    try {
      const newState = !hasAcceptedTerms;
      await updateDoc(doc(db, 'users', user.uid), {
        hasAcceptedTerms: newState,
        termsAcceptedAt: newState ? new Date().toISOString() : null,
      });
      Alert.alert(
        'Legal Status Updated',
        `Terms acceptance: ${newState ? '✓ ACCEPTED' : '✗ NOT ACCEPTED'}\n\nReload the app to see the legal modal again.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to update legal status: ${error?.message}`);
    }
  };

  const onResetNewUser = async () => {
    Alert.alert(
      'Reset to New User',
      'This will simulate a fresh install. You will see the full onboarding flow again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'guideSeen_v2',
                'guideNeedMarkOne',
                'guideShowExplore',
                'seen_intro_program',
                'seen_intro_urges',
                'seen_intro_stats',
                'program_intro_pending',
                'beginnerLaunch_v1',
              ]);
              if (user) {
                await updateDoc(doc(db, 'users', user.uid), {
                  hasAcceptedTerms: false,
                  week1SetupDone: false,
                  week1Anchors: [],
                });
              }
              Alert.alert(
                'Reset Complete',
                'App reset to new user state. Please restart the app to see the full onboarding flow.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert('Error', `Failed to reset: ${error?.message}`);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Testing</Text>
      <View style={styles.infoRow}>
        <Ionicons name="calendar-outline" size={18} color="#6B7280" />
        <Text style={styles.infoText}>Current Day: {day}</Text>
      </View>
      <View style={[styles.infoRow, { marginTop: 6 }]}>
        <Ionicons name="time-outline" size={18} color="#6B7280" />
        <Text style={[styles.infoText, { color: '#6B7280' }]}>Start: {startDate ? new Date(startDate).toLocaleDateString() : 'Not set'}</Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        <TouchableOpacity style={styles.button} onPress={onAdvanceDay}>
          <Ionicons name="arrow-forward-circle-outline" size={20} color="#4A90E2" />
          <Text style={styles.buttonText}>Advance Day (+1)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={onStartFresh}>
          <Ionicons name="sparkles-outline" size={20} color="#4A90E2" />
          <Text style={styles.buttonText}>Start Fresh (Day 1)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { borderColor: '#10B981', backgroundColor: '#F0FDF4' }]} 
          onPress={onToggleLegalAcceptance}
        >
          <Ionicons 
            name={hasAcceptedTerms ? "shield-checkmark-outline" : "shield-outline"} 
            size={20} 
            color={hasAcceptedTerms ? "#10B981" : "#EF4444"} 
          />
          <Text style={[styles.buttonText, { color: hasAcceptedTerms ? "#10B981" : "#EF4444" }]}>
            {hasAcceptedTerms ? 'Terms: ✓' : 'Terms: ✗'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]} 
          onPress={onResetNewUser}
        >
          <Ionicons name="refresh-outline" size={20} color="#F59E0B" />
          <Text style={[styles.buttonText, { color: '#F59E0B' }]}>Reset New User</Text>
        </TouchableOpacity>

        {graceStatus && (
          <TouchableOpacity style={[styles.button, { borderColor: '#8B5CF6', flex: 1 }]} onPress={() => setShowGraceDebug(!showGraceDebug)}>
            <Ionicons name="bug-outline" size={20} color="#8B5CF6" />
            <Text style={[styles.buttonText, { color: '#8B5CF6' }]}>Grace Debug</Text>
          </TouchableOpacity>
        )}
      </View>

      {showGraceDebug && graceStatus && (
        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>Grace Status</Text>
          <Text style={styles.debugText}>✅ Grace Available: {graceStatus.graceAvailable ? 'YES' : 'NO'}</Text>
          <Text style={styles.debugText}>📅 Days Used (past 7): {graceStatus.graceDaysUsedInPast7.length > 0 ? graceStatus.graceDaysUsedInPast7.join(', ') : 'None'}</Text>
          <Text style={styles.debugText}>⏱️ Next Available: Day {graceStatus.nextAvailableDay} ({graceStatus.nextAvailableDaysFromNow} days from now)</Text>
          <Text style={styles.debugText}>📝 All Grace Days: {graceStatus.allGraceDayDates.length > 0 ? graceStatus.allGraceDayDates.join(', ') : 'None'}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
  },
  debugPanel: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8B5CF6',
  },
  debugTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6D28D9',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#6D28D9',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
});
