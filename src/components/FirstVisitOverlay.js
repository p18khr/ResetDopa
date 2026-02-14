// src/components/FirstVisitOverlay.js
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useTheme } from '../context/ThemeContext';

export default function FirstVisitOverlay({ visible, title, text, animation = 'sparkles', onClose }) {
  const { isDarkMode, colors } = useTheme();
  const renderAnimation = () => {
    if (animation === 'fireworks') {
      return (
        <LottieView
          source={require('../../assets/animations/fireworks.json')}
          autoPlay
          loop
          style={{ width: 180, height: 140, alignSelf: 'center', marginBottom: 6 }}
        />
      );
    }
    // Fallback: simple icon if Lottie not provided
    return (
      <View style={{ alignItems: 'center', marginBottom: 6 }}>
        <Ionicons name="sparkles" size={28} color={colors.accent} />
      </View>
    );
  };

  return (
    <Modal visible={!!visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
          {renderAnimation()}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>
          <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: colors.accent }]}>
            <Text style={[styles.btnText, { color: '#fff' }]}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  title: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  text: { fontSize: 14, textAlign: 'center' },
  btn: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  btnText: { fontWeight: '700' },
});
