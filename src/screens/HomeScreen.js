import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Theme from '../utils/theme';
import { TIER, TIER_COLORS, TIER_BG_COLORS } from '../utils/classInfo';
import { getHistory } from '../utils/storage';
import { getModelStatus } from '../utils/model';

function getItemTier(item) {
  if (item.tier !== undefined) return item.tier;
  return item.isSuspicious ? TIER.SUSPICIOUS : TIER.BENIGN;
}

const TIER_ICON_LABELS = ['OK', '?', 'FLAG'];

export default function HomeScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    const entries = await getHistory();
    setHistory(entries);
  };

  useFocusEffect(useCallback(() => {
    loadHistory();
  }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const status = getModelStatus();
  const totalScans = history.length;
  // Flagged = Uncertain + Suspicious (tier >= 1)
  const flagged = history.filter((item) => getItemTier(item) >= TIER.UNCERTAIN).length;
  const clear = totalScans - flagged;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Theme.accent} />}
    >
      <Text style={styles.welcome}>Welcome to</Text>
      <Text style={styles.title}>Skana</Text>
      <Text style={styles.subtitle}>AI-powered skin lesion screening</Text>

      {status.mock && (
        <View style={styles.mockBadge}>
          <Text style={styles.mockText}>Demo Mode - Add model file for real inference</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.scanCard}
        onPress={() => navigation.navigate('ScanFlow')}
        activeOpacity={0.85}
      >
        <View style={styles.scanGlow} />
        <View style={styles.scanIcon}>
          <Text style={styles.scanIconText}>SCAN</Text>
        </View>
        <View style={styles.scanTextWrap}>
          <Text style={styles.scanTitle}>Start New Scan</Text>
          <Text style={styles.scanDesc}>Capture or upload a lesion photo</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.statsRow}>
        {[
          { label: 'Total Scans', value: totalScans, color: Theme.accent },
          { label: 'Clear', value: clear, color: Theme.benign },
          { label: 'Flagged', value: flagged, color: Theme.suspicious },
        ].map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {history.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Scans</Text>
            <TouchableOpacity onPress={() => navigation.navigate('History')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listCard}>
            {history.slice(0, 3).map((item, index) => {
              const tier = getItemTier(item);
              const tierColor = TIER_COLORS[tier];
              const tierBgColor = TIER_BG_COLORS[tier];
              const iconLabel = TIER_ICON_LABELS[tier];

              return (
                <View key={item.id} style={[styles.historyRow, index < 2 && styles.historyBorder]}>
                  <View style={[styles.historyIcon, { backgroundColor: tierBgColor }]}>
                    <Text style={[styles.historyIconText, { color: tierColor }]}>{iconLabel}</Text>
                  </View>
                  <View style={styles.historyText}>
                    <Text style={styles.historyDiag} numberOfLines={1}>{item.diagnosis}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>
                  <Text style={[styles.historyConf, { color: tierColor }]}>
                    {item.confidence}%
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {history.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyBadge}>NEW</Text>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyDesc}>Take your first skin lesion scan to get started</Text>
        </View>
      )}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          <Text style={styles.disclaimerLead}>Screening tool only. </Text>
          This app does not provide medical diagnosis. Always consult a qualified dermatologist for proper evaluation.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  content: { padding: Theme.paddingH, paddingTop: 8, paddingBottom: 40 },
  welcome: { fontSize: 14, color: Theme.textSecondary, fontWeight: '500', marginTop: 12 },
  title: { fontSize: 36, fontWeight: '800', color: Theme.accent, letterSpacing: -1, marginBottom: 2 },
  subtitle: { fontSize: 15, color: Theme.textSecondary, marginBottom: 24 },
  mockBadge: { backgroundColor: Theme.warningBg, borderRadius: 10, padding: 10, marginBottom: 16 },
  mockText: { color: Theme.warning, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  scanCard: {
    backgroundColor: Theme.accent, borderRadius: Theme.radiusLg, padding: 24,
    marginBottom: 18, flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
  },
  scanGlow: {
    position: 'absolute', top: -60, right: -60, width: 160, height: 160,
    borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scanIcon: {
    width: 54, height: 54, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginRight: 16,
  },
  scanIconText: { color: Theme.text, fontSize: 11, fontWeight: '800' },
  scanTextWrap: { flex: 1 },
  scanTitle: { color: Theme.text, fontSize: 19, fontWeight: '700', marginBottom: 3 },
  scanDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: Theme.bgCard, borderRadius: 16, padding: 18,
    alignItems: 'center', borderWidth: 1, borderColor: Theme.border,
  },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: {
    fontSize: 11, color: Theme.textSecondary, fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4, textAlign: 'center',
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: Theme.text },
  seeAll: { fontSize: 14, color: Theme.accent },
  listCard: {
    backgroundColor: Theme.bgCard, borderRadius: Theme.radiusMd,
    borderWidth: 1, borderColor: Theme.border, overflow: 'hidden',
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingHorizontal: 16 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: Theme.borderLight },
  historyIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  historyIconText: { fontSize: 11, fontWeight: '800' },
  historyText: { flex: 1 },
  historyDiag: { fontSize: 15, fontWeight: '600', color: Theme.text },
  historyDate: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },
  historyConf: { fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyBadge: {
    fontSize: 11, color: Theme.accent, backgroundColor: Theme.bgCardLight,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginBottom: 12, fontWeight: '800',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Theme.text, marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: Theme.textSecondary, textAlign: 'center' },
  disclaimer: {
    marginTop: 24, padding: 14, backgroundColor: Theme.warningBg,
    borderRadius: Theme.radiusSm, borderWidth: 1, borderColor: 'rgba(255,179,71,0.15)',
  },
  disclaimerText: { fontSize: 12, color: Theme.textSecondary, lineHeight: 18 },
  disclaimerLead: { color: Theme.warning, fontWeight: '700' },
});
