import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Theme from '../utils/theme';
import { TIER, TIER_COLORS, TIER_BG_COLORS } from '../utils/classInfo';
import { getHistory, clearHistory } from '../utils/storage';

// Resolve tier for items that may predate the three-tier system
function getItemTier(item) {
  if (item.tier !== undefined) return item.tier;
  return item.isSuspicious ? TIER.SUSPICIOUS : TIER.BENIGN;
}

const TIER_ICON_LABELS = ['OK', '?', 'FLAG'];

const FILTERS = ['All', 'Suspicious', 'Uncertain', 'Benign'];

export default function HistoryScreen() {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState('All');

  useFocusEffect(useCallback(() => {
    (async () => setHistory(await getHistory()))();
  }, []));

  const filtered = history.filter((item) => {
    if (filter === 'All') return true;
    const tier = getItemTier(item);
    if (filter === 'Suspicious') return tier === TIER.SUSPICIOUS;
    if (filter === 'Uncertain') return tier === TIER.UNCERTAIN;
    if (filter === 'Benign') return tier === TIER.BENIGN;
    return true;
  });

  const handleClear = () => {
    Alert.alert('Clear History', 'Are you sure you want to delete all scan history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => setHistory(await clearHistory()) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>History</Text>
          <Text style={styles.subtitle}>Your past scan results</Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearBtn}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((value) => (
          <TouchableOpacity
            key={value}
            style={[styles.filterChip, filter === value && styles.filterActive]}
            onPress={() => setFilter(value)}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{value}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyBadge}>LOG</Text>
          <Text style={styles.emptyTitle}>
            {history.length === 0 ? 'No scans yet' : `No ${filter.toLowerCase()} scans`}
          </Text>
        </View>
      ) : (
        <View style={styles.listCard}>
          {filtered.map((item, index) => {
            const tier = getItemTier(item);
            const tierColor = TIER_COLORS[tier];
            const tierBgColor = TIER_BG_COLORS[tier];
            const iconLabel = TIER_ICON_LABELS[tier];

            return (
              <View key={item.id} style={[styles.row, index < filtered.length - 1 && styles.rowBorder]}>
                <View style={[styles.icon, { backgroundColor: tierBgColor }]}>
                  <Text style={[styles.iconText, { color: tierColor }]}>{iconLabel}</Text>
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.diagText} numberOfLines={1}>{item.diagnosis}</Text>
                  <Text style={styles.dateText}>
                    {item.date}
                    {' | '}
                    <Text style={{ color: tierColor, fontWeight: '600' }}>
                      {item.confidence}%
                    </Text>
                  </Text>
                </View>
                <Text style={styles.chevron}>{'>'}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  content: { padding: Theme.paddingH, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 12, marginBottom: 4 },
  title: { fontSize: 34, fontWeight: '800', color: Theme.text },
  subtitle: { fontSize: 15, color: Theme.textSecondary, marginTop: 2 },
  clearBtn: { fontSize: 14, color: Theme.suspicious, fontWeight: '600', marginTop: 12 },
  filterRow: { gap: 8, marginTop: 16, marginBottom: 20, paddingRight: 4 },
  filterChip: {
    paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20,
    backgroundColor: Theme.bgCard, borderWidth: 1, borderColor: Theme.border,
  },
  filterActive: { backgroundColor: Theme.accent, borderColor: 'transparent' },
  filterText: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary },
  filterTextActive: { color: Theme.text },
  listCard: {
    backgroundColor: Theme.bgCard, borderRadius: Theme.radiusMd,
    borderWidth: 1, borderColor: Theme.border, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Theme.borderLight },
  icon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  iconText: { fontSize: 10, fontWeight: '800' },
  rowText: { flex: 1 },
  diagText: { fontSize: 16, fontWeight: '600', color: Theme.text },
  dateText: { fontSize: 12, color: Theme.textSecondary, marginTop: 3 },
  chevron: { fontSize: 18, color: Theme.textMuted, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyBadge: {
    fontSize: 11, color: Theme.textSecondary, backgroundColor: Theme.bgCardLight,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 12, fontWeight: '800',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Theme.textSecondary },
});
