// src/components/DashboardStats.tsx
// Minimal demo component showing persona-based metric labels in action

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { usePersonaLabels } from '../hooks/usePersonaLabels';

interface MetricCardProps {
  label: string;
  value: string;
  subtitle: string;
  colors: any;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, subtitle, colors }) => (
  <View style={[styles.card, { backgroundColor: colors.surfacePrimary }]}>
    <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
  </View>
);

/**
 * DashboardStats - Demonstrates persona-based label system
 * 
 * Shows 3 metric cards with labels that adapt to user's chosen identity:
 * - Student: "Study Hours Protected", "Exam Readiness", "Distractions Blocked"
 * - Professional: "Deep Work Achieved", "Focus ROI", "Productivity Intact"  
 * - Minimalist: "Mindful Hours", "Scroll Urges Defeated", "Digital Clutter Blocked"
 */
export default function DashboardStats() {
  const { colors } = useTheme();
  const labels = usePersonaLabels();

  // Example metric values (replace with real data)
  const metrics = {
    metric1: { value: '4.2h', subtitle: 'Last 7 days' },
    metric2: { value: '87%', subtitle: 'This week' },
    metric3: { value: '23', subtitle: 'Total this month' },
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.header, { color: colors.text }]}>Your Progress</Text>
      
      <View style={styles.cardsContainer}>
        <MetricCard
          label={labels.metric1}
          value={metrics.metric1.value}
          subtitle={metrics.metric1.subtitle}
          colors={colors}
        />
        
        <MetricCard
          label={labels.metric2}
          value={metrics.metric2.value}
          subtitle={metrics.metric2.subtitle}
          colors={colors}
        />
        
        <MetricCard
          label={labels.metric3}
          value={metrics.metric3.value}
          subtitle={metrics.metric3.subtitle}
          colors={colors}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  value: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
});
