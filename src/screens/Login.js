// src/screens/Login.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, KeyboardAvoidingView, Platform, Animated, Image } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async () => {
    // Trim whitespace
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert('Required Fields', 'Please enter both email and password');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      // Navigation handled by App.js based on auth state
    } catch (error) {
      console.error('❌ Login error:', error?.code, error?.message);
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-email') {
        message = 'Invalid email address format';
      } else if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect password';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed attempts. Try again later or reset your password.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Invalid email or password';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled. Please contact support.';
      }
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Email Required', 'Please enter your email address first');
      return;
    }
    
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Reset Email Sent',
        `A password reset link has been sent to ${email}. Please check your inbox.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      let message = 'Failed to send reset email';
      if (error.code === 'auth/user-not-found') message = 'No account found with this email';
      Alert.alert('Error', message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
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
            <Image
              source={require('../../assets/images/ResetDopa_Logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.title}>ResetDopa™</Text>
            <Text style={styles.tagline}>Regain will. Rewire habits. Enjoy life again.</Text>
            <Text style={styles.subtitle}>Welcome back! Ready to continue your journey?</Text>
            <View style={styles.infoBanner}>
              <Text style={styles.infoText}>Cloud sync resumes after login. Your progress will sync across devices.</Text>
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
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Logging in...' : 'Login'}
              </Text>
            </TouchableOpacity>



            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkTextBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
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
  logo: {
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  logoImage: {
    width: 72,
    height: 72,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 14,
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
