import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

const PREMIUM_GOLD = '#FFD700';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSubscription } from '../context/SubscriptionContext';

interface WeeklyAudit {
  id: string;
  audit: string;
  urge_count: number;
  failures_this_week: number;
  had_protocol_purchase: boolean;
  week_ending: any;
  timestamp: any;
}

interface AuditSection {
  title: string;
  body: string;
}

function parseAuditSections(raw: string): AuditSection[] {
  if (!raw) return [];
  const parts = raw.split(/\n?##\s+/).filter(Boolean);
  return parts.map((part) => {
    const newline = part.indexOf('\n');
    if (newline === -1) return { title: part.trim(), body: '' };
    return {
      title: part.slice(0, newline).trim(),
      body: part.slice(newline + 1).trim(),
    };
  });
}

function formatDate(val: any): string {
  if (!val) return '—';
  const d = val.toDate?.() || new Date(val);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function SectionPill({ label, colors }: { label: string; colors: any }) {
  const sectionColors: Record<string, string> = {
    'The Pattern': '#4A90E2',
    "The Weakest Link": '#FF6B35',
    "Next Week's Protocol": '#10B981',
  };
  const color = sectionColors[label] || colors.accent;
  return (
    <View style={[styles.sectionPill, { borderColor: color }]}>
      <Text style={[styles.sectionPillText, { color }]}>{label.toUpperCase()}</Text>
    </View>
  );
}

function LockedProtocolCard({
  onUnlock,
  colors,
}: {
  onUnlock: () => void;
  colors: any;
}) {
  return (
    <View style={[styles.section, styles.lockedCard, { borderColor: PREMIUM_GOLD, backgroundColor: colors.surfacePrimary }]}>
      <View style={styles.lockedHeader}>
        <SectionPill label="Next Week's Protocol" colors={{ accent: PREMIUM_GOLD }} />
        <Ionicons name="lock-closed" size={16} color={PREMIUM_GOLD} />
      </View>
      <View style={styles.blurredPreview}>
        <Text style={[styles.sectionBody, styles.blurredText, { color: colors.textSecondary }]}>
          If it is after 9 PM and you reach for your phone, then start a 10-minute walk before opening any app — your personalized plan based on this week's pattern.
        </Text>
        <View style={[styles.blurOverlay, { backgroundColor: colors.surfacePrimary }]} />
      </View>
      <TouchableOpacity style={styles.unlockBtn} onPress={onUnlock} activeOpacity={0.8}>
        <Ionicons name="lock-open" size={14} color="#000" style={{ marginRight: 6 }} />
        <Text style={styles.unlockBtnText}>UNLOCK PRO TO REVEAL</Text>
      </TouchableOpacity>
    </View>
  );
}

function AuditCard({
  audit,
  expanded,
  onToggle,
  isPremium,
  onUnlock,
}: {
  audit: WeeklyAudit;
  expanded: boolean;
  onToggle: () => void;
  isPremium: boolean;
  onUnlock: () => void;
}) {
  const { colors } = useTheme();
  const sections = parseAuditSections(audit.audit);
  const freeSections = sections.filter((s) => s.title !== "Next Week's Protocol");
  const protocolSection = sections.find((s) => s.title === "Next Week's Protocol");

  return (
    <View style={[styles.card, { backgroundColor: colors.surfacePrimary, borderColor: colors.border }]}>
      <TouchableOpacity style={styles.cardHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Week of {formatDate(audit.week_ending)}
          </Text>
          <View style={styles.metaRow}>
            <Text style={[styles.metaBadge, { backgroundColor: colors.border, color: colors.textSecondary }]}>
              {audit.urge_count} urges
            </Text>
            <Text style={[styles.metaBadge, { backgroundColor: audit.failures_this_week > 0 ? '#FF3333' : '#10B981', color: '#fff' }]}>
              {audit.failures_this_week} failures
            </Text>
            {isPremium && (
              <Text style={[styles.metaBadge, { backgroundColor: '#FFD700', color: '#000' }]}>
                PRO
              </Text>
            )}
          </View>
        </View>
        <Text style={[styles.chevron, { color: colors.accent }]}>{expanded ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.auditBody, { borderTopColor: colors.border }]}>
          {freeSections.length > 0 ? (
            freeSections.map((sec, i) => (
              <View key={i} style={styles.section}>
                <SectionPill label={sec.title} colors={colors} />
                <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                  {sec.body || '—'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
              {audit.audit || 'No content available.'}
            </Text>
          )}

          {isPremium && protocolSection ? (
            <View style={styles.section}>
              <SectionPill label={protocolSection.title} colors={colors} />
              <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
                {protocolSection.body || '—'}
              </Text>
            </View>
          ) : (
            <LockedProtocolCard onUnlock={onUnlock} colors={colors} />
          )}
        </View>
      )}
    </View>
  );
}

export function NeuroAuditScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth() as any;
  const { colors } = useTheme();
  const { isPremium, presentPaywall } = useSubscription();
  const [audits, setAudits] = useState<WeeklyAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'users', user.uid, 'weekly_audits'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as WeeklyAudit));
        setAudits(docs);
        if (docs.length > 0 && !expandedId) setExpandedId(docs[0].id);
        setLoading(false);
      },
      (err) => {
        console.error('[NeuroAudit] snapshot error:', err);
        setLoading(false);
      }
    );

    return unsub;
  }, [user?.uid]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: colors.accent }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>NEURO-AUDIT</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Weekly behavioral analysis · Generated every Sunday
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 48 }} />
        ) : audits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No audits yet</Text>
            <Text style={[styles.emptyBody, { color: colors.textSecondary }]}>
              Your first Neuro-Audit runs every Sunday at 8 PM PT.{'\n'}
              Subscribe to ResetDopa Pro before Sunday to unlock your personalized next-week plan.
            </Text>
          </View>
        ) : (
          audits.map((audit) => (
            <AuditCard
              key={audit.id}
              audit={audit}
              expanded={expandedId === audit.id}
              onToggle={() => setExpandedId(expandedId === audit.id ? null : audit.id)}
              isPremium={isPremium}
              onUnlock={presentPaywall}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 24, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  subtitle: { fontSize: 13 },
  scroll: { padding: 16, paddingBottom: 40 },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  metaRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  metaBadge: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
  },
  chevron: { fontSize: 12, fontWeight: '700', marginLeft: 12 },
  auditBody: { borderTopWidth: 1, padding: 16, gap: 16 },
  section: { gap: 8 },
  sectionPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  sectionBody: { fontSize: 14, lineHeight: 22 },
  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  emptyBody: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  lockedCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  lockedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unlockBtn: {
    backgroundColor: PREMIUM_GOLD,
    borderRadius: 6,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  unlockBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  blurredPreview: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
  },
  blurredText: {
    opacity: 0.35,
  },
  blurOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
});
