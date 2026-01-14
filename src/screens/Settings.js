// src/screens/Settings.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Alert, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut, deleteUser } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import TestingControls from '../components/TestingControls';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerForPushNotifications, scheduleDailyReminder, cancelAllNotifications, scheduleMilestoneNotification, scheduleDailyMoodPrompt, isExpoGo } from '../utils/notifications';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { deleteDoc, doc } from 'firebase/firestore';

export default function Settings({ navigation }) {
  const { user, startDate, getCurrentDay, startDateResets, resetProgramStartDate } = useContext(AppContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('9:00 AM');
  const [moodEnabled, setMoodEnabled] = useState(true);
  const [moodHour, setMoodHour] = useState(20);
  const [moodMinute, setMoodMinute] = useState(0);

  const privacyUrl = Constants.expoConfig?.extra?.privacyPolicyUrl || 'https://resetdopa.com/privacy';
  const termsUrl = Constants.expoConfig?.extra?.termsUrl || 'https://resetdopa.com/terms';

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const enabled = await AsyncStorage.getItem('notificationsEnabled');
      setNotificationsEnabled(enabled === 'true');
      const mEnabled = await AsyncStorage.getItem('moodEnabled');
      setMoodEnabled(mEnabled === null ? true : (mEnabled === 'true'));
      const mHour = await AsyncStorage.getItem('moodHour');
      const mMinute = await AsyncStorage.getItem('moodMinute');
      setMoodHour(mHour ? parseInt(mHour) : 20);
      setMoodMinute(mMinute ? parseInt(mMinute) : 0);
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const testNotification = async () => {
    try {
      if (isExpoGo) {
        Alert.alert('Limited in Expo Go', 'Remote push is not available in Expo Go. Use a development build for full testing. We will send a local test notification now.');
      }
      await registerForPushNotifications();
      await scheduleMilestoneNotification('streak_7');
      Alert.alert('Success', 'Test notification sent! Check your notifications in a few seconds.');
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert('Error', error.message || 'Failed to send test notification');
    }
  };

  const toggleNotifications = async (value) => {
    try {
      if (value) {
        await registerForPushNotifications();
        await scheduleDailyReminder(9, 0);
        await AsyncStorage.setItem('notificationsEnabled', 'true');
        setNotificationsEnabled(true);
        Alert.alert('Success', 'Daily reminders enabled at 9:00 AM');
      } else {
        await cancelAllNotifications();
        await AsyncStorage.setItem('notificationsEnabled', 'false');
        setNotificationsEnabled(false);
        Alert.alert('Success', 'Notifications disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const toggleMoodReminders = async (value) => {
    try {
      if (value) {
        await registerForPushNotifications();
        await scheduleDailyMoodPrompt(moodHour, moodMinute);
        await AsyncStorage.setItem('moodEnabled', 'true');
        setMoodEnabled(true);
        Alert.alert('Success', `Daily mood prompt enabled at ${formatTime(moodHour, moodMinute)}`);
      } else {
        await cancelAllNotifications();
        await AsyncStorage.setItem('moodEnabled', 'false');
        setMoodEnabled(false);
        Alert.alert('Success', 'Mood prompts disabled');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update mood reminder settings');
    }
  };

  const setMoodTime = async (h, m) => {
    try {
      setMoodHour(h);
      setMoodMinute(m);
      await AsyncStorage.setItem('moodHour', String(h));
      await AsyncStorage.setItem('moodMinute', String(m));
      if (moodEnabled) {
        await cancelAllNotifications();
        await registerForPushNotifications();
        await scheduleDailyMoodPrompt(h, m);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update mood prompt time');
    }
  };

  const formatTime = (h, m) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const mm = m.toString().padStart(2, '0');
    return `${hour12}:${mm} ${ampm}`;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear devDayOffset before logout so it doesn't persist to next user
              await AsyncStorage.removeItem('devDayOffset');
              await signOut(auth);
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'This action is PERMANENT and cannot be undone. All your data will be deleted immediately, including:\n\n• Your progress and streaks\n• All logged urges\n• Badges and achievements\n• Settings and preferences\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Keep Account',
          style: 'default',
        },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            // Final confirmation before deletion
            Alert.alert(
              'Final Confirmation',
              'Type "DELETE" to confirm account deletion',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const currentUser = auth.currentUser;
                      if (!currentUser) {
                        Alert.alert('Error', 'User not found. Please logout and try again.');
                        return;
                      }

                      // Show loading alert
                      Alert.alert('Deleting...', 'Please wait while we delete your account and data.');

                      // Delete Firestore user document
                      if (currentUser.uid) {
                        try {
                          await deleteDoc(doc(db, 'users', currentUser.uid));
                          if (__DEV__) console.log('✅ Firestore user document deleted');
                        } catch (firestoreError) {
                          console.warn('⚠️ Firestore deletion warning:', firestoreError);
                          // Continue with auth deletion even if Firestore fails
                        }
                      }

                      // Clear local storage
                      try {
                        await AsyncStorage.clear();
                        if (__DEV__) console.log('✅ AsyncStorage cleared');
                      } catch (storageError) {
                        console.warn('⚠️ AsyncStorage clear warning:', storageError);
                      }

                      // Delete Firebase Auth user (must be last)
                      await deleteUser(currentUser);
                      if (__DEV__) console.log('✅ Firebase Auth user deleted');

                      // Show success and navigate to login
                      Alert.alert(
                        'Account Deleted',
                        'Your account and all associated data have been permanently deleted.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              navigation.reset({
                                index: 0,
                                routes: [{ name: 'Login' }],
                              });
                            },
                          },
                        ]
                      );
                    } catch (error) {
                      console.error('❌ Account deletion error:', error);
                      
                      // Handle specific Firebase errors
                      let errorMessage = 'Failed to delete account. Please try again later.';
                      
                      if (error.code === 'auth/requires-recent-login') {
                        errorMessage = 'For security, please logout and login again before deleting your account.';
                      } else if (error.code === 'auth/network-request-failed') {
                        errorMessage = 'Network error. Please check your connection and try again.';
                      }
                      
                      Alert.alert('Error', errorMessage);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const openLink = async (url, title) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert(title, 'Unable to open link right now. Please try again later.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      
      <ScrollView style={{ backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: '#333' }]}>Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications-outline" size={20} color="#6366F1" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Daily Reminders</Text>
                  <Text style={styles.settingSubtitle}>Get motivated every day at 9:00 AM</Text>
                </View>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: '#ccc', true: '#6366F1' }}
                thumbColor={notificationsEnabled ? '#fff' : '#f5f5f5'}
              />
            </View>
          </View>
          
          <TouchableOpacity style={[styles.testButton, { backgroundColor: '#fff', borderColor: '#6366F1' }]} onPress={testNotification}>
            <Ionicons name="notifications" size={20} color="#6366F1" />
            <Text style={[styles.testButtonText, { color: '#6366F1' }]}>Send Test Notification</Text>
          </TouchableOpacity>

          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="happy-outline" size={20} color="#6366F1" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Daily Mood Prompt</Text>
                  <Text style={styles.settingSubtitle}>Ask for mood at {formatTime(moodHour, moodMinute)}</Text>
                </View>
              </View>
              <Switch
                value={moodEnabled}
                onValueChange={toggleMoodReminders}
                trackColor={{ false: '#ccc', true: '#6366F1' }}
                thumbColor={moodEnabled ? '#fff' : '#f5f5f5'}
              />
            </View>
            <View style={{ flexDirection:'row', gap: 8, marginTop: 12 }}>
              {[20, 21, 22].map(h => (
                <TouchableOpacity key={h} style={[styles.seedButton, { backgroundColor: '#f5f5f5', borderColor: '#e0e0e0' }]} onPress={() => setMoodTime(h, 0)}>
                  <Text style={styles.seedButtonText}>{formatTime(h, 0)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Ionicons name="sunny" size={20} color="#6366F1" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Theme</Text>
                  <Text style={styles.settingSubtitle}>Light mode</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>{user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.profileButton} 
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-outline" size={20} color="#4A90E2" />
            <Text style={styles.profileButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={[styles.card, { marginTop: 12 }]}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#6B7280" />
              <Text style={styles.infoText}>Program Start: {startDate ? new Date(startDate).toLocaleDateString() : 'Not set'}</Text>
            </View>
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <Ionicons name="refresh" size={18} color="#6B7280" />
              <Text style={[styles.infoText, { color: '#6B7280' }]}>Resets used: {startDateResets}/2</Text>
            </View>
            <View style={[styles.settingRow, { marginTop: 12 }]}>
              <View style={styles.settingInfo}>
                <Ionicons name="refresh-outline" size={20} color="#4A90E2" />
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>Reset Program Day</Text>
                  <Text style={styles.settingSubtitle}>Set start date to today and recalculate day</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.resetButton, startDateResets >= 2 && { backgroundColor: '#D1D5DB' }]}
                disabled={startDateResets >= 2}
                onPress={() => {
                  Alert.alert(
                    'Reset Program Day',
                    'You can reset the start date up to 2 times total. Proceed to set today as Day 1?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Reset', style: 'destructive', onPress: async () => {
                        const res = await resetProgramStartDate();
                        if (res?.ok) {
                          Alert.alert('Program reset', `Day is now ${getCurrentDay()}. Resets used: ${res.used}/2.`);
                        }
                      }}
                    ]
                  );
                }}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Testing Section - DEV ONLY */}
        {__DEV__ && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Testing</Text>
            <TestingControls navigation={navigation} />
          </View>
        )}

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.legalButton} onPress={() => openLink(privacyUrl, 'Privacy Policy')}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#4A90E2" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingSubtitle}>Learn how we handle your data</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.legalButton} onPress={() => openLink(termsUrl, 'Terms of Service')}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text-outline" size={20} color="#4A90E2" />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Terms of Service</Text>
                <Text style={styles.settingSubtitle}>Understand your rights and obligations</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>ResetDopa™ v1.0.0</Text>
          <Text style={styles.footerSubtext}>Your journey to brain rewiring</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  profileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A90E2',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  seedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
  legalButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
    borderColor: '#4A90E2',
  },
  seedButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#DC2626',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resetButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

