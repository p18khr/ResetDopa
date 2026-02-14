import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lawLabels } from '../utils/lawLabels';
import { AppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

function pickDailyLaw(devDayOffset) {
  const entries = Object.entries(lawLabels);
  const d = new Date();
  try { if (devDayOffset && Number.isFinite(devDayOffset)) d.setDate(d.getDate() + devDayOffset); } catch {}
  const daySeed = d.toISOString().slice(0,10); // YYYY-MM-DD (virtual)
  const idx = [...daySeed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % entries.length;
  const [, law] = entries[idx];
  return law;
}

export default function LawOfTheDay({ onLearnMore }) {
  const { devDayOffset } = useContext(AppContext);
  const { isDarkMode, colors } = useTheme();
  const law = pickDailyLaw(devDayOffset);
  if (!law) return null;
  
  // Dynamic example based on the law
  const getExample = (label) => {
    if (label.includes('Pareto')) return 'Pick the 1-2 tasks today that create 80% of your progress.';
    if (label.includes('Gilbert')) return 'Start with one tiny step right now — no planning, just act.';
    if (label.includes('Wilson')) return 'Even 1 small task today compounds — no action is too minor.';
    if (label.includes('Goodhart')) return 'Track trends, not just numbers — read what the data means for your behavior.';
    if (label.includes('Lin')) return 'Share a small win today — clarity spreads motivation.';
    if (label.includes('Murphy')) return 'Prepare for friction — have a backup plan for slip-ups.';
    return 'Apply this in a tiny, concrete way today.';
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.headerRow}>
        <Ionicons name="bulb" size={18} color={colors.accent} />
        <Text style={[styles.title, { color: colors.accent }]}>Law of the Day</Text>
      </View>
      <Text style={[styles.lawName, { color: colors.text }]}>{law.label}</Text>
      {!!law.description && <Text style={[styles.description, { color: colors.textSecondary }]}>{law.description}</Text>}
      <Text style={[styles.description, { marginTop: 4, color: colors.textSecondary }]}>
        Example: {getExample(law.label)}
      </Text>
      {onLearnMore && (
        <TouchableOpacity style={[styles.learnBtn, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]} onPress={onLearnMore}>
          <Ionicons name="book-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.learnText, { color: colors.accent }]}>Learn about these laws</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontWeight: '800', fontSize: 12 },
  lawName: { fontWeight: '700', fontSize: 14, marginTop: 6 },
  description: { fontSize: 12, marginTop: 4 },
  learnBtn: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 10 },
  learnText: { fontWeight: '700', fontSize: 12 },
});
