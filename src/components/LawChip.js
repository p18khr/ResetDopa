import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LawChip({ label, description, law, style }) {
  const lawData = law || { label, description };
  const hasLabel = !!lawData?.label;
  const [open, setOpen] = useState(false);
  if (!hasLabel) return null;
  const APPLY = {
    'Pareto Principle': 'Identify the top 1–2 actions that move most results and do them first.',
    "Gilbert's Law": 'Start tiny today: pick one easy action and complete it.',
    "Wilson's Law": 'Break tasks into small parts — log small wins consistently.',
    "Goodhart's Law": 'Use charts to guide, not drive behavior — read trends, avoid gaming metrics.',
    "Lin's Law": 'Name feelings and triggers — clarity makes change easier and shareable.',
    "Murphy's Law": 'Keep flows simple and resilient — expect edge cases.',
  };
  const applyText = APPLY[lawData.label];
  const EXAMPLES = {
    'Pareto Principle': 'Example: Choose one task that yields the biggest payoff (e.g., 25-min deep work instead of inbox triage).',
    "Gilbert's Law": 'Example: If a task feels heavy, cut it to 2 minutes and start now.',
    "Wilson's Law": 'Example: Break “exercise 30 min” into “stretch 5 min” and log the win.',
    "Goodhart's Law": 'Example: Don’t chase chart lines — choose actions that actually change behavior.',
    "Lin's Law": 'Example: Write “lonely after scrolling” — then text a friend for 2 minutes.',
    "Murphy's Law": 'Example: Expect hiccups. Prepare one fallback task you can always do (e.g., 3 breaths).',
  };
  const QUOTES = {
    'Pareto Principle': '“Focus on the vital few.”',
    "Goodhart's Law": '“When a measure becomes a target, it ceases to be a good measure.” — Goodhart',
    'Consistency': '“We are what we repeatedly do.” — Aristotle',
  };
  return (
    <>
      <View style={[styles.wrap, style]}>
        <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.85} style={styles.chip}>
          <Text style={styles.text}>{lawData.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`What is ${lawData.label}?`} style={styles.infoBtn}>
          <Ionicons name="information-circle" size={18} color="#1A56DB" />
        </TouchableOpacity>
      </View>
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{lawData.label}</Text>
            {!!lawData.description && (
              <Text style={styles.cardDesc}>{lawData.description}</Text>
            )}
            {!!applyText && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.cardSubTitle}>How to apply</Text>
                <Text style={styles.cardDesc}>{applyText}</Text>
                {!!EXAMPLES[lawData.label] && (
                  <Text style={[styles.cardDesc, { marginTop: 6, color:'#374151' }]}>{EXAMPLES[lawData.label]}</Text>
                )}
                {!!QUOTES[lawData.label] && (
                  <Text style={[styles.cardDesc, { marginTop: 6, fontStyle:'italic', color:'#6B7280' }]}>{QUOTES[lawData.label]}</Text>
                )}
              </View>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: '#EEF2FF',
    borderColor: '#1E3A8A',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    color: '#1A56DB',
    fontSize: 12,
    fontWeight: '700',
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoBtn: {
    backgroundColor: '#E5F0FF',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxWidth: 420,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#374151' },
  cardSubTitle: { fontSize: 13, color: '#1A1A1A', fontWeight: '700' },
  closeBtn: { marginTop: 12, alignSelf: 'flex-end', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#E5F0FF', borderRadius: 8 },
  closeText: { color: '#1A56DB', fontWeight: '600' },
});
