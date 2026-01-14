// src/screens/UrgeLogger.js
import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, StatusBar, Modal, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FirstVisitOverlay from '../components/FirstVisitOverlay';

export default function UrgeLogger({ navigation }) {
  const [emotion, setEmotion] = useState('');
  const [note, setNote] = useState('');
  const { logUrge, updateUrgeOutcome, urges, devDayOffset } = useContext(AppContext);

  const [intensity, setIntensity] = useState('medium');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [otherFeeling, setOtherFeeling] = useState('');
  const [trigger, setTrigger] = useState('');
  const [otherTrigger, setOtherTrigger] = useState('');

  const FEELINGS = [
    'anxious','overwhelmed','stressed','sad','lonely','angry','frustrated','guilty','ashamed','jealous','insecure','restless','tired','numb','empty','bored','craving','irritable','fearful','disappointed','embarrassed','hopeless','worthless','resentful','worried','panicked'
  ];
  const TRIGGERS = [
    'scrolling','loneliness','work stress','boredom','procrastination','late night','conflict','fatigue','porn','social media','alcohol','gaming'
  ];

  const URGE_REPLACEMENTS = {
    high: [
      { task: 'Cold water face splash', duration: '30 sec', why: 'Immediate shock resets nervous system' },
      { task: '10 push-ups', duration: '1 min', why: 'Releases physical tension instantly' },
      { task: '2-minute deep breathing', duration: '2 min', why: 'Activates parasympathetic calm' },
    ],
    medium: [
      { task: 'Walk around room', duration: '2 min', why: 'Breaks stimulus pattern' },
      { task: 'Drink cold water', duration: '1 min', why: 'Physical reset signal' },
      { task: '5 push-ups', duration: '30 sec', why: 'Quick energy release' },
    ],
    low: [
      { task: 'Deep breath x5', duration: '1 min', why: 'Gentle nervous system regulation' },
      { task: 'Stand & stretch', duration: '1 min', why: 'Body awareness shift' },
      { task: 'Look out window', duration: '30 sec', why: 'Distance gaze relaxation' },
    ]
  };

  const [lastLoggedId, setLastLoggedId] = useState(null);
  const [requireOutcome, setRequireOutcome] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState(null);
  const [blockForm, setBlockForm] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const seen = await AsyncStorage.getItem('seen_intro_urges');
        if (!mounted) return;
        if (seen !== 'true') setShowIntro(true);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const onLog = () => {
    if (!note.trim()) {
      Alert.alert('Reflection required', 'Please describe what caused the urge — identifying the trigger builds focus, empathy, and control.');
      return;
    }
    const finalEmotion = (otherFeeling && otherFeeling.trim()) ? otherFeeling.trim().toLowerCase() : (emotion && emotion.trim() ? emotion : '');
    const finalTrigger = (otherTrigger && otherTrigger.trim()) ? otherTrigger.trim().toLowerCase() : (trigger && trigger.trim() ? trigger : '');
    if (!finalEmotion) {
      Alert.alert('Feeling required', 'Please select or enter how you felt.');
      return;
    }
    if (!finalTrigger) {
      Alert.alert('Trigger required', 'Please select or enter what triggered it.');
      return;
    }
    const id = logUrge({ emotion: finalEmotion, note, intensity, trigger: finalTrigger });
    setLastLoggedId(id);
    setShowSuggestions(true);
    setRequireOutcome(true);
    setSelectedOutcome(null);
    setBlockForm(true);
  };

  const closeSuggestions = () => {
    if (requireOutcome && !selectedOutcome) {
      Alert.alert('Pick an outcome', 'Please select “I Resisted” or “I Slipped” to complete this log.');
      return;
    }
    setShowSuggestions(false);
    setRequireOutcome(false);
    setSelectedOutcome(null);
    setNote('');
    setEmotion('');
    setIntensity('medium');
    setOtherFeeling('');
    setTrigger('');
    setOtherTrigger('');
    setBlockForm(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    try { if (devDayOffset && Number.isFinite(devDayOffset)) today.setDate(today.getDate() + devDayOffset); } catch {}
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      bored: '😐',
      stressed: '😰',
      anxious: '😰',
      overwhelmed: '😵‍💫',
      sad: '😢',
      lonely: '😔',
      angry: '😡',
      frustrated: '😠',
      guilty: '😞',
      ashamed: '😳',
      jealous: '😒',
      insecure: '😟',
      restless: '🫨',
      tired: '😪',
      numb: '😶',
      empty: '⚪',
      craving: '🤤',
      irritable: '😤',
      fearful: '😨',
      disappointed: '😞',
      embarrassed: '😳',
      hopeless: '😞',
      worthless: '😔',
      resentful: '😒',
      worried: '😟',
      panicked: '😱'
    };
    return icons[emotion] || '💭';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0 } ]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />
      <FirstVisitOverlay
        visible={showIntro}
        title="Urge Logger"
        text="Log urges with feelings and triggers. Tag the outcome to build resilience over time."
        onClose={async () => { setShowIntro(false); try { await AsyncStorage.setItem('seen_intro_urges','true'); } catch {} }}
      />
      <ScrollView style={styles.container}>
        {blockForm && (
          <View pointerEvents="auto" style={styles.blockOverlay}>
            <Text style={styles.blockText}>Log in progress — choose outcome to finalize</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Log an Urge</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Lin's Law — Why logging matters */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color="#1E3A8A" style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.lawTitle}>Lin's Law</Text>
            <Text style={styles.infoTextBanner}>
              Clarity spreads: naming feelings and triggers makes patterns visible and easier to change. 
              Naming the feeling and root trigger makes the problem half solved. Logging urges builds awareness and reveals patterns to change.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>How are you feeling?</Text>
          <View style={styles.chipRow}>
            {FEELINGS.map(e => (
              <TouchableOpacity 
                key={e} 
                onPress={() => setEmotion(prev => prev === e ? '' : e)} 
                style={[styles.chip, emotion === e && styles.chipActive]}
              >
                <Text style={styles.chipEmoji}>{getEmotionIcon(e)}</Text>
                <Text style={[styles.chipText, emotion === e && styles.chipTextActive]}>
                  {e.charAt(0).toUpperCase() + e.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Other feeling (optional)</Text>
          <TextInput
            placeholder="If not listed or unsure, type here"
            value={otherFeeling}
            onChangeText={setOtherFeeling}
            style={styles.input}
            placeholderTextColor="#9CA3AF"
          />

          <Text style={[styles.label, { marginTop: 16 }]}>What triggered it? (select one)</Text>
                    <View style={styles.chipRow}>
                      {TRIGGERS.map(t => (
                        <TouchableOpacity key={t} onPress={() => setTrigger(prev => prev === t ? '' : t)} style={[styles.chip, trigger === t && styles.chipActive]}>
                          <Text style={styles.chipText}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={[styles.label, { marginTop: 8 }]}>Other trigger (optional)</Text>
                    <TextInput
                      placeholder="If not listed, type here"
                      value={otherTrigger}
                      onChangeText={setOtherTrigger}
                      style={styles.input}
                      placeholderTextColor="#9CA3AF"
                    />

          <Text style={[styles.label, { marginTop: 20 }]}>Intensity Level</Text>
          <View style={styles.intensityRow}>
            {[{val:'low',emoji:'😌',label:'Low'},{val:'medium',emoji:'😟',label:'Medium'},{val:'high',emoji:'😫',label:'High'}].map(i => (
              <TouchableOpacity 
                key={i.val} 
                onPress={() => setIntensity(i.val)} 
                style={[styles.intensityChip, intensity === i.val && styles.intensityChipActive]}
              >
                <Text style={styles.intensityEmoji}>{i.emoji}</Text>
                <Text style={[styles.intensityText, intensity === i.val && styles.intensityTextActive]}>
                  {i.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>What caused it? (required)</Text>
          <TextInput 
            placeholder="Describe the trigger, context, people, apps, thoughts…" 
            value={note} 
            onChangeText={setNote} 
            style={styles.input} 
            multiline 
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity style={styles.logBtn} onPress={onLog}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.logBtnText}>Log Urge (+2 CP)</Text>
          </TouchableOpacity>
        </View>

        {/* Urge Replacement Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsCard}>
            <View style={styles.suggestionsHeader}>
              <Text style={styles.suggestionsTitle}>💪 Try These Right Now</Text>
              <TouchableOpacity onPress={closeSuggestions}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.suggestionsSubtitle}>Quick actions to redirect this urge</Text>
            
            {URGE_REPLACEMENTS[intensity].map((item, idx) => (
              <View key={idx} style={styles.suggestionItem}>
                <View style={styles.suggestionIcon}>
                  <Text style={styles.suggestionIconText}>{idx + 1}</Text>
                </View>
                <View style={styles.suggestionContent}>
                  <Text style={styles.suggestionTask}>{item.task}</Text>
                  <Text style={styles.suggestionWhy}>⏱️ {item.duration} • {item.why}</Text>
                </View>
              </View>
            ))}

            {/* Outcome tagging */}
            <View style={styles.outcomeRow}>
              <TouchableOpacity style={[styles.outcomeBtn, { backgroundColor: '#ECFDF5', borderColor: '#10B981' }]} onPress={() => {
                setSelectedOutcome('resisted');
                if (lastLoggedId) updateUrgeOutcome(lastLoggedId, 'resisted');
                // Close without guard to avoid spurious warning on immediate tap
                setShowSuggestions(false);
                setRequireOutcome(false);
                setNote(''); setEmotion(''); setIntensity('medium'); setOtherFeeling(''); setTrigger(''); setOtherTrigger(''); setBlockForm(false);
              }}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={[styles.outcomeText, { color: '#065F46' }]}>I Resisted</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.outcomeBtn, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]} onPress={() => {
                setSelectedOutcome('slipped');
                if (lastLoggedId) updateUrgeOutcome(lastLoggedId, 'slipped');
                setShowSuggestions(false);
                setRequireOutcome(false);
                setNote(''); setEmotion(''); setIntensity('medium'); setOtherFeeling(''); setTrigger(''); setOtherTrigger(''); setBlockForm(false);
              }}>
                <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={[styles.outcomeText, { color: '#7F1D1D' }]}>I Slipped</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.gotItBtn} onPress={closeSuggestions}>
              <Text style={styles.gotItBtnText}>Got it, thanks! 💙</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Urge History */}
        {!showSuggestions && (
          <View style={styles.historySection}>
            <Text style={styles.historyTitle}>Recent Urges ({urges.length})</Text>
            
            {urges.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>✨</Text>
                <Text style={styles.emptyText}>No urges logged yet</Text>
                <Text style={styles.emptySubtext}>Track your urges to build awareness</Text>
              </View>
            ) : (
              urges.map((urge, index) => (
                <View key={urge.id} style={styles.urgeCard}>
                  <View style={styles.urgeHeader}>
                    <View style={styles.urgeEmotion}>
                      <Text style={styles.urgeEmoji}>{getEmotionIcon(urge.emotion)}</Text>
                      <Text style={styles.urgeEmotionText}>
                        {urge.emotion.charAt(0).toUpperCase() + urge.emotion.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.urgeTime}>
                      {formatDate(urge.timestamp)} • {formatTime(urge.timestamp)}
                    </Text>
                  </View>
                  {urge.note ? (
                    <Text style={styles.urgeNote}>{urge.note}</Text>
                  ) : null}
                  <View style={{ flexDirection:'row', flexWrap:'wrap', gap:6, marginTop:4 }}>
                    {urge.intensity ? (
                      <Text style={styles.urgeMeta}>Intensity: {urge.intensity}</Text>
                    ) : null}
                    {urge.outcome ? (
                      <Text style={[styles.urgeMeta, urge.outcome === 'resisted' ? { color:'#065F46' } : { color:'#7F1D1D' }]}>Outcome: {urge.outcome}</Text>
                    ) : null}
                    {urge.trigger ? (
                      <Text style={styles.urgeMeta}>Trigger: {urge.trigger}</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  form: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
  },
  lawTitle: {
    color: '#1E3A8A',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  infoTextBanner: {
    flex: 1,
    color: '#1E3A8A',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  chipEmoji: {
    marginRight: 6,
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#065F46',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  intensityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  intensityChipActive: {
    borderColor: '#4A90E2',
    backgroundColor: '#EFF6FF',
  },
  intensityEmoji: {
    marginRight: 6,
    fontSize: 14,
  },
  intensityText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '600',
  },
  intensityTextActive: {
    color: '#1E3A8A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  logBtn: {
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  suggestionsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    position: 'relative',
    zIndex: 20,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  suggestionsSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  suggestionIconText: {
    color: '#1D4ED8',
    fontWeight: '700',
  },
  suggestionContent: { flex: 1 },
  suggestionTask: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  suggestionWhy: {
    fontSize: 12,
    color: '#6B7280',
  },
  gotItBtn: {
    marginTop: 12,
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  gotItBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outcomeRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  outcomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
  },
  outcomeText: {
    fontWeight: '700',
  },
  historySection: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyEmoji: { fontSize: 28, marginBottom: 8 },
  emptyText: { fontWeight: '700', color: '#111827' },
  emptySubtext: { color: '#6B7280', marginTop: 4 },
  urgeCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  urgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  urgeEmotion: { flexDirection: 'row', alignItems: 'center' },
  urgeEmoji: { marginRight: 6, fontSize: 16 },
  urgeEmotionText: { fontWeight: '700', color: '#111827' },
  urgeTime: { color: '#6B7280', fontSize: 12 },
  urgeNote: { color: '#374151', marginTop: 4 },
  blockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.15)',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockText: {
    color: '#111827',
    fontWeight: '700',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
