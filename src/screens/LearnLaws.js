// src/screens/LearnLaws.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lawLabels } from '../utils/lawLabels';

function groupByLawLabel(labelMap) {
  const grouped = {};
  Object.entries(labelMap).forEach(([screen, law]) => {
    const key = law.label || screen;
    if (!grouped[key]) grouped[key] = { label: key, description: law.description || '', screens: [] };
    grouped[key].screens.push(screen);
    // Prefer the longest description if duplicates differ
    if (law.description && (law.description.length > (grouped[key].description || '').length)) {
      grouped[key].description = law.description;
    }
  });
  return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
}

export default function LearnLaws({ navigation }) {
  const entries = groupByLawLabel(lawLabels);
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={styles.header}>
          <View style={{ flexDirection:'row', alignItems:'center', gap:10 }}>
            <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Go back">
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>Learn About Laws</Text>
          </View>
        </View>
        {entries.map((law, idx) => (
          <View key={idx} style={styles.card}>
            <Text style={styles.cardTitle}>{law.label}</Text>
            {!!law.description && <Text style={styles.cardDesc}>{law.description}</Text>}
            {!!law.screens?.length && (
              <Text style={styles.usedOn}>Reflected in: {law.screens.join(', ')}</Text>
            )}
          </View>
        ))}
      </ScrollView>
      {/* Bottom overlay to ensure white background behind bottom nav */}
      <View style={styles.bottomOverlay} />
    </SafeAreaView>
  );
}

const ANDROID_TOP = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F7FA', paddingTop: ANDROID_TOP },
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#374151' },
  usedOn: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  bottomOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, backgroundColor: '#FFFFFF' },
});
