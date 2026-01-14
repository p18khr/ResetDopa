// src/screens/Signup.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, KeyboardAvoidingView, Platform, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';

export default function Signup({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(fadeAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignup = async () => {
    // Trim whitespace
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedEmail || !trimmedPassword || !trimmedConfirm) {
      Alert.alert('Required Fields', 'Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please try again.');
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    if (trimmedPassword.length > 128) {
      Alert.alert('Invalid Password', 'Password must be less than 128 characters');
      return;
    }

    // Check password strength
    const hasNumber = /\d/.test(trimmedPassword);
    const hasLetter = /[a-zA-Z]/.test(trimmedPassword);
    if (!hasNumber || !hasLetter) {
      Alert.alert(
        'Weak Password',
        'Password should contain both letters and numbers for better security',
        [
          { text: 'Use Anyway', onPress: () => createAccount(trimmedEmail, trimmedPassword) },
          { text: 'Change Password', style: 'cancel' }
        ]
      );
      return;
    }

    await createAccount(trimmedEmail, trimmedPassword);
  };

  const createAccount = async (validatedEmail, validatedPassword) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, validatedEmail, validatedPassword);
      const user = userCredential.user;

      // Create initial user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        startDate: new Date().toISOString(),
        hasAcceptedTerms: false,
        calmPoints: 0,
        streak: 0,
        streakEvaluatedForDay: 0,
        lastStreakDayCounted: 0,
        urges: [],
        todayPicks: {},
        todayCompletions: {},
        tasks: [
          { id: 't1', title: '10 min sunlight', points: 5, done: false },
          { id: 't2', title: '5 min meditation', points: 8, done: false },
          { id: 't3', title: '25 min deep work', points: 10, done: false },
        ],
        badges: [
          { id: 'first_day', title: 'First Day', got: false },
          { id: 'streak_3', title: '3-Day Streak', got: false },
          { id: 'streak_7', title: '7-Day Streak', got: false },
          { id: 'streak_30', title: '30-Day Streak', got: false },
          { id: 'streak_90', title: '90-Day Streak', got: false },
          { id: 'tasks_10', title: '10 Tasks Done', got: false },
          { id: 'tasks_50', title: '50 Tasks Completed', got: false },
          { id: 'tasks_100', title: '100 Tasks', got: false },
          { id: 'calm_100', title: '100 Calm Points', got: false },
          { id: 'calm_500', title: '500 Calm Points', got: false },
          { id: 'calm_1000', title: '1000 Calm Points', got: false },
          { id: 'urge_resist_10', title: '10 Urges Resisted', got: false },
          { id: 'urge_resist_50', title: '50 Urges Resisted', got: false },
        ],
        startDateResets: 0,
        week1SetupDone: false,
        week1Completed: false,
        dailyMood: {},
        dailyMetrics: {},
        completedWeeksWithFireworks: [],
        graceDayDates: [],
        lastRolloverPrevDayEvaluated: 0,
        rolloverBannerInfo: null,
        rolloverBannerDismissedDay: 0,
      });

      Alert.alert(
        'Welcome! 🎉',
        'Your account has been created successfully. Ready to start your dopamine reset journey?',
        [{ text: 'Let\'s Go!' }]
      );
    } catch (error) {
      if (__DEV__) console.error('Signup error:', error?.code, error?.message);
      let message = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Try logging in instead.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password is too weak. Please use a stronger password.';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      Alert.alert('Signup Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="flash" size={60} color="#4A90E2" />
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Start your dopamine reset journey today</Text>
              <View style={styles.infoBanner}>
                <Text style={styles.infoText}>Cloud sync begins after signup. Your progress will sync across devices.</Text>
              </View>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="At least 6 characters"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor="#9CA3AF"
              />

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.linkText}>
                  Already have an account? <Text style={styles.linkTextBold}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  infoBanner: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E5F3FF',
    borderRadius: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#1F2937',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
  },
  button: {
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#6B7280',
  },
  linkTextBold: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
