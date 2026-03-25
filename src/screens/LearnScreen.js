import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import Theme from '../utils/theme';
import { CLASS_INFO } from '../utils/classInfo';

const CANCER_TYPES = ['Melanoma', 'Basal cell carcinoma', 'Actinic keratoses'];
const BENIGN_TYPES = ['Melanocytic nevi', 'Benign keratosis', 'Vascular lesions', 'Dermatofibroma'];

export default function LearnScreen() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    const info = CLASS_INFO[selected];

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => setSelected(null)}>
          <Text style={styles.backBtn}>Back</Text>
        </TouchableOpacity>

        <View style={styles.detailCard}>
          <View
            style={[
              styles.detailIcon,
              {
                backgroundColor: info.color === Theme.benign
                  ? Theme.benignBg
                  : info.color === Theme.suspicious
                    ? Theme.suspiciousBg
                    : Theme.warningBg,
              },
            ]}
          >
            <Text style={[styles.detailIconText, { color: info.color }]}>
              {info.risk === 'Benign' ? 'OK' : '!' }
            </Text>
          </View>

          <Text style={styles.detailName}>{selected}</Text>
          <View
            style={[
              styles.riskBadge,
              {
                backgroundColor: info.color === Theme.benign
                  ? Theme.benignBg
                  : info.color === Theme.suspicious
                    ? Theme.suspiciousBg
                    : Theme.warningBg,
              },
            ]}
          >
            <Text style={[styles.riskText, { color: info.color }]}>{info.risk}</Text>
          </View>

          <Text style={styles.detailDesc}>{info.description}</Text>

          <View style={styles.watchCard}>
            <Text style={styles.watchLabel}>WHAT TO WATCH FOR</Text>
            <Text style={styles.watchText}>{info.watchFor}</Text>
          </View>
        </View>

        <View style={styles.adviceCard}>
          <Text style={styles.watchLabel}>WHEN TO SEE A DOCTOR</Text>
          <Text style={styles.adviceText}>
            Consult a dermatologist if you notice any lesion that is new, changing, or looks different from your other moles. The ABCDE rule for melanoma: Asymmetry, Border irregularity, Color variation, Diameter over 6mm, and Evolution over time.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Learn</Text>
      <Text style={styles.subtitle}>Understanding skin lesion types</Text>

      <Text style={[styles.sectionLabel, { color: Theme.suspicious }]}>CANCEROUS / PRE-CANCEROUS</Text>
      <View style={styles.listCard}>
        {CANCER_TYPES.map((name, index) => {
          const info = CLASS_INFO[name];

          return (
            <TouchableOpacity
              key={name}
              style={[styles.row, index < CANCER_TYPES.length - 1 && styles.rowBorder]}
              onPress={() => setSelected(name)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.rowIcon,
                  { backgroundColor: info.color === Theme.suspicious ? Theme.suspiciousBg : Theme.warningBg },
                ]}
              >
                <Text style={[styles.rowIconText, { color: info.color }]}>!</Text>
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{name}</Text>
                <Text style={[styles.rowRisk, { color: info.color }]}>{info.risk}</Text>
              </View>
              <Text style={styles.chevron}>{'>'}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: Theme.benign }]}>BENIGN (NON-CANCEROUS)</Text>
      <View style={styles.listCard}>
        {BENIGN_TYPES.map((name, index) => (
          <TouchableOpacity
            key={name}
            style={[styles.row, index < BENIGN_TYPES.length - 1 && styles.rowBorder]}
            onPress={() => setSelected(name)}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: Theme.benignBg }]}>
              <Text style={[styles.rowIconText, { color: Theme.benign }]}>OK</Text>
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowName}>{name}</Text>
              <Text style={[styles.rowRisk, { color: Theme.benign }]}>Benign</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.aboutCard}>
        <Text style={styles.aboutTitle}>About Our AI Model</Text>
        <Text style={styles.aboutText}>
          DermaScan v10 uses an EfficientNet-B2 model trained on 27,758 clinical and dermoscopic images. It incorporates patient metadata (age, sex, body location) and uses a three-tier result system: Likely Benign, Uncertain, and Suspicious.
        </Text>
        <View style={styles.aboutStats}>
          <View style={styles.aboutStat}>
            <Text style={styles.aboutStatValue}>0.92</Text>
            <Text style={styles.aboutStatLabel}>Binary AUC</Text>
          </View>
          <View style={styles.aboutStat}>
            <Text style={styles.aboutStatValue}>0.71</Text>
            <Text style={styles.aboutStatLabel}>Macro F1</Text>
          </View>
          <View style={styles.aboutStat}>
            <Text style={styles.aboutStatValue}>27.7K</Text>
            <Text style={styles.aboutStatLabel}>Training Images</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  content: { padding: Theme.paddingH, paddingBottom: 40 },
  title: { fontSize: 34, fontWeight: '800', color: Theme.text, marginTop: 12 },
  subtitle: { fontSize: 15, color: Theme.textSecondary, marginTop: 2, marginBottom: 24 },
  backBtn: { fontSize: 15, color: Theme.accent, fontWeight: '500', marginTop: 8, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10, paddingLeft: 4 },
  listCard: {
    backgroundColor: Theme.bgCard,
    borderRadius: Theme.radiusMd,
    borderWidth: 1,
    borderColor: Theme.border,
    overflow: 'hidden',
    marginBottom: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingHorizontal: 18 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Theme.borderLight },
  rowIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowIconText: { fontSize: 14, fontWeight: '800' },
  rowText: { flex: 1 },
  rowName: { fontSize: 16, fontWeight: '600', color: Theme.text },
  rowRisk: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  chevron: { fontSize: 18, color: Theme.textMuted, fontWeight: '700' },
  detailCard: {
    backgroundColor: Theme.bgCard,
    borderRadius: Theme.radiusMd,
    padding: 24,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  detailIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  detailIconText: { fontSize: 20, fontWeight: '800' },
  detailName: { fontSize: 26, fontWeight: '800', color: Theme.text, marginBottom: 8 },
  riskBadge: { paddingVertical: 5, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 20 },
  riskText: { fontSize: 13, fontWeight: '700' },
  detailDesc: { fontSize: 15, color: Theme.textSecondary, lineHeight: 24 },
  watchCard: { marginTop: 24, padding: 18, backgroundColor: Theme.bgCardLight, borderRadius: 16 },
  watchLabel: { fontSize: 11, fontWeight: '700', color: Theme.textMuted, letterSpacing: 1, marginBottom: 10 },
  watchText: { fontSize: 14, color: Theme.text, lineHeight: 22 },
  adviceCard: {
    backgroundColor: Theme.bgCard,
    borderRadius: Theme.radiusMd,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  adviceText: { fontSize: 14, color: Theme.textSecondary, lineHeight: 22 },
  aboutCard: { backgroundColor: Theme.bgCard, borderRadius: Theme.radiusMd, padding: 20, borderWidth: 1, borderColor: Theme.border },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: Theme.text, marginBottom: 10 },
  aboutText: { fontSize: 13, color: Theme.textSecondary, lineHeight: 20, marginBottom: 16 },
  aboutStats: { flexDirection: 'row', gap: 10 },
  aboutStat: { flex: 1, backgroundColor: Theme.bgCardLight, borderRadius: 12, padding: 14, alignItems: 'center' },
  aboutStatValue: { fontSize: 20, fontWeight: '800', color: Theme.accent },
  aboutStatLabel: {
    fontSize: 10,
    color: Theme.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
