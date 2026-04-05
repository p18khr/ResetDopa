import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useBlockedAppGate } from '../hooks/useBlockedAppGate';

/**
 * EXAMPLE: How to integrate VagusGatekeeper blocking with real app/link opening
 *
 * This component shows how to use the useBlockedAppGate hook
 * to gate any navigation/link opening behind the breathing exercise.
 */
export default function ExampleBlockedAppsIntegration() {
  const { navigateWithGate, GateModal } = useBlockedAppGate();

  /**
   * Example 1: Open external link (YouTube, Instagram, etc.)
   */
  const handleOpenYouTube = () => {
    navigateWithGate('youtube', () => {
      Linking.openURL('https://youtube.com').catch(() => {
        Alert.alert('Error', 'Could not open YouTube');
      });
    });
  };

  /**
   * Example 2: Open social media
   */
  const handleOpenInstagram = () => {
    navigateWithGate('instagram', () => {
      // Try native app first, fallback to web
      Linking.openURL('instagram://').catch(() => {
        Linking.openURL('https://instagram.com');
      });
    });
  };

  /**
   * Example 3: Navigate to internal screen (if it's "blocked")
   */
  const handleNavigateToBlocked = (navigation, screenName) => {
    navigateWithGate('internal_screen', () => {
      navigation.navigate(screenName);
    });
  };

  return (
    <>
      {/* CRITICAL: Place the gate modal at ROOT of your component tree */}
      <GateModal />

      <View style={styles.container}>
        <Text style={styles.heading}>Blocked Apps Integration</Text>

        {/* Example buttons */}
        <TouchableOpacity style={styles.button} onPress={handleOpenYouTube}>
          <Text style={styles.buttonText}>▶️ Open YouTube</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleOpenInstagram}>
          <Text style={styles.buttonText}>📱 Open Instagram</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          💡 If these apps are blocked in Settings, the 60s breathing gate will appear before opening.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  note: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});
