// src/components/FirstVisitOverlay.js
import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

export default function FirstVisitOverlay({ visible, title, text, animation = 'sparkles', onClose }) {
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
        <Ionicons name="sparkles" size={28} color="#2563EB" />
      </View>
    );
  };

  return (
    <Modal visible={!!visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {renderAnimation()}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.text}>{text}</Text>
          <TouchableOpacity onPress={onClose} style={styles.btn}>
            <Text style={styles.btnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  title: { fontSize: 16, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 6 },
  text: { fontSize: 14, color: '#374151', textAlign: 'center' },
  btn: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2563EB' },
  btnText: { color: '#fff', fontWeight: '700' },
});
