// src/screens/Profile.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Alert } from 'react-native';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateUserData } from '../services/firestore.service';

const AVATAR_OPTIONS = [
  { id: 1, emoji: '🧘', name: 'Zen' },
  { id: 2, emoji: '💪', name: 'Strong' },
  { id: 3, emoji: '🎯', name: 'Focused' },
  { id: 4, emoji: '🌟', name: 'Star' },
  { id: 5, emoji: '🔥', name: 'Fire' },
  { id: 6, emoji: '🚀', name: 'Rocket' },
  { id: 7, emoji: '🌱', name: 'Growth' },
  { id: 8, emoji: '🏆', name: 'Champion' },
];

export default function Profile({ navigation }) {
  const { user, claimBadge } = useContext(AppContext);
  const { isDarkMode, colors } = useTheme();
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [goal, setGoal] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem('username');
      const savedAvatar = await AsyncStorage.getItem('avatar');
      const savedGoal = await AsyncStorage.getItem('goal');
      
      if (savedUsername) setUsername(savedUsername);
      if (savedAvatar) setSelectedAvatar(parseInt(savedAvatar));
      if (savedGoal) setGoal(savedGoal);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    setSaving(true);
    try {
      // Save to AsyncStorage
      await AsyncStorage.setItem('username', username);
      await AsyncStorage.setItem('avatar', selectedAvatar.toString());
      await AsyncStorage.setItem('goal', goal);

      // Save to Firestore if user is logged in
      if (user?.uid) {
        await updateUserData(user.uid, {
          username,
          avatar: selectedAvatar,
          goal,
        });
      }

      // Unlock Identity badge if name, goal, and email exist
      if (username.trim() && goal.trim() && user?.email) {
        try { claimBadge && claimBadge('identity_set'); } catch {}
      }
      Alert.alert('Success', 'Profile updated successfully! 🎉');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const selectedAvatarData = AVATAR_OPTIONS.find(a => a.id === selectedAvatar);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Avatar Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Choose Your Avatar</Text>

          <View style={[styles.avatarPreview, { backgroundColor: colors.surfacePrimary }]}>
            <Text style={styles.avatarPreviewEmoji}>{selectedAvatarData?.emoji}</Text>
            <Text style={[styles.avatarPreviewName, { color: colors.accent }]}>{selectedAvatarData?.name}</Text>
          </View>

          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map(avatar => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarOption,
                  { backgroundColor: colors.surfacePrimary, borderColor: 'transparent' },
                  selectedAvatar === avatar.id && { borderColor: colors.accent, backgroundColor: colors.surfaceSecondary }
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
              >
                <Text style={styles.avatarEmoji}>{avatar.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Username */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Username</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surfacePrimary }]}>
            <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Enter your username"
              placeholderTextColor={colors.textTertiary}
              value={username}
              onChangeText={setUsername}
              maxLength={20}
              autoCapitalize="none"
            />
          </View>
          <Text style={[styles.inputHint, { color: colors.textTertiary }]}>{username.length}/20 characters</Text>
        </View>

        {/* Goal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Goal</Text>
          <View style={[styles.inputContainer, { backgroundColor: colors.surfacePrimary }]}>
            <Ionicons name="flag-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="What's your main goal?"
              placeholderTextColor={colors.textTertiary}
              value={goal}
              onChangeText={setGoal}
              maxLength={60}
              multiline
            />
          </View>
          <Text style={[styles.inputHint, { color: colors.textTertiary }]}>{goal.length}/60 characters</Text>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <View style={[styles.infoCard, { backgroundColor: colors.surfacePrimary }]}>
            <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }, saving && styles.saveButtonDisabled]}
          onPress={saveProfile}
          disabled={saving}
        >
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  avatarPreview: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarPreviewEmoji: {
    fontSize: 80,
    marginBottom: 8,
  },
  avatarPreviewName: {
    fontSize: 18,
    fontWeight: '600',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  avatarOption: {
    width: 70,
    height: 70,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  avatarOptionSelected: {
  },
  avatarEmoji: {
    fontSize: 36,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'right',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  infoText: {
    fontSize: 15,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 32,
    marginBottom: 20,
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
