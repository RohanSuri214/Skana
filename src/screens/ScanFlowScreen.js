import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Theme from '../utils/theme';
import { CLASS_INFO, TIER, TIER_NAMES, TIER_COLORS, TIER_BG_COLORS } from '../utils/classInfo';
import { predict } from '../utils/model';
import { addScan } from '../utils/storage';

const PHASES = { PICK: 0, DETAILS: 1, ANALYZING: 2, RESULT: 3, ERROR: 4 };

const LOCATIONS = [
  { key: 'face', label: 'Face' },
  { key: 'scalp', label: 'Scalp' },
  { key: 'neck', label: 'Neck' },
  { key: 'ear', label: 'Ear' },
  { key: 'chest', label: 'Chest' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'back', label: 'Back' },
  { key: 'trunk', label: 'Trunk' },
  { key: 'upper extremity', label: 'Upper Arm' },
  { key: 'lower extremity', label: 'Lower Leg' },
  { key: 'hand', label: 'Hand' },
  { key: 'foot', label: 'Foot' },
  { key: 'acral', label: 'Acral' },
  { key: 'genital', label: 'Genital' },
];

const TIER_MESSAGES = [
  'This lesion appears benign. Continue monitoring for any changes.',
  'This lesion has some characteristics worth checking. Consider consulting a dermatologist.',
  'This lesion shows characteristics associated with skin cancer. See a dermatologist promptly.',
];

const TIER_BADGE_LABELS = ['OK', '?', 'FLAG'];

export default function ScanFlowScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase] = useState(PHASES.PICK);
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [scanStep, setScanStep] = useState(0);
  const [scanError, setScanError] = useState(null);

  // Patient details state
  const [ageText, setAgeText] = useState('');
  const [sex, setSex] = useState(null);
  const [location, setLocation] = useState(null);

  const pickImage = async (useCamera) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', `Please grant ${useCamera ? 'camera' : 'photo library'} access to scan lesions.`);
      return;
    }

    const options = {
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    };

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

    if (!pickerResult.canceled && pickerResult.assets?.[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setPhase(PHASES.DETAILS);
    }
  };

  const analyzeImage = async (uri, patientData) => {
    if (!uri) {
      Alert.alert('Error', 'No image selected.');
      return;
    }
    setPhase(PHASES.ANALYZING);
    setScanStep(0);

    const timerOne = setTimeout(() => setScanStep(1), 700);
    const timerTwo = setTimeout(() => setScanStep(2), 1400);

    try {
      const prediction = await predict(uri, patientData);
      setResult(prediction);

      // Don't save OOD (invalid scan) results to history
      if (!prediction.isOOD) {
        await addScan({
          imageUri: uri,
          diagnosis: prediction.diagnosis,
          confidence: prediction.confidence,
          isSuspicious: prediction.isSuspicious,
          cancerProbability: prediction.cancerProbability,
          tier: prediction.tier,
          tierName: prediction.tierName,
          allProbabilities: prediction.allProbabilities,
          metadata: patientData,
        });
      }

      setPhase(PHASES.RESULT);
    } catch (error) {
      console.error('Scan error:', error);
      setScanError(error.message || 'Unknown inference error');
      setPhase(PHASES.ERROR);
    } finally {
      clearTimeout(timerOne);
      clearTimeout(timerTwo);
    }
  };

  const handleSkip = () => {
    analyzeImage(imageUri, null);
  };

  const handleContinue = () => {
    const age = ageText.trim() !== '' ? parseInt(ageText, 10) : null;
    const patientData = {
      age: age != null && age >= 0 && age <= 100 ? age : null,
      sex: sex ?? 'unknown',
      location: location ?? 'unknown',
    };
    analyzeImage(imageUri, patientData);
  };

  const resetScan = () => {
    setPhase(PHASES.PICK);
    setImageUri(null);
    setResult(null);
    setScanStep(0);
    setAgeText('');
    setSex(null);
    setLocation(null);
    setScanError(null);
  };

  // ── PICK phase ────────────────────────────────────────────────────────────
  if (phase === PHASES.PICK) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHitArea}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.pickContent}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>SCAN</Text>
          </View>
          <Text style={styles.pickTitle}>Scan a Skin Lesion</Text>
          <Text style={styles.pickDesc}>
            Take a close-up photo or choose from your gallery. Ensure good lighting and focus on the lesion.
          </Text>

          <TouchableOpacity style={styles.cameraBtn} onPress={() => pickImage(true)} activeOpacity={0.85}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>CAM</Text>
            </View>
            <View>
              <Text style={styles.btnTitle}>Take Photo</Text>
              <Text style={styles.btnSubtitle}>Use your camera</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryBtn} onPress={() => pickImage(false)} activeOpacity={0.85}>
            <View style={[styles.actionIcon, styles.galleryIcon]}>
              <Text style={styles.actionIconText}>LIB</Text>
            </View>
            <View>
              <Text style={[styles.btnTitle, styles.galleryBtnTitle]}>Choose from Gallery</Text>
              <Text style={[styles.btnSubtitle, styles.galleryBtnSubtitle]}>Upload an existing photo</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Tips for best results:</Text>
            <Text style={styles.tipItem}>- Hold camera 10-15cm from the lesion</Text>
            <Text style={styles.tipItem}>- Use natural lighting when possible</Text>
            <Text style={styles.tipItem}>- Keep the lesion centered in frame</Text>
            <Text style={styles.tipItem}>- Avoid shadows across the lesion</Text>
          </View>

          <View style={styles.disclaimerNote}>
            <Text style={styles.disclaimerNoteText}>
              This AI was trained on both clinical and dermoscopic images. For best results, use good lighting and hold your camera 10-15cm from the lesion.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ── DETAILS phase ─────────────────────────────────────────────────────────
  if (phase === PHASES.DETAILS) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.detailsContent}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={resetScan} style={styles.backBtnHitArea}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
          </View>

          {imageUri && <Image source={{ uri: imageUri }} style={styles.detailsThumb} />}

          <Text style={styles.detailsTitle}>Patient Details</Text>
          <Text style={styles.detailsSubtitle}>
            Adding details improves accuracy but is optional.
          </Text>

          {/* Age */}
          <Text style={styles.fieldLabel}>AGE</Text>
          <TextInput
            style={styles.ageInput}
            placeholder="Enter age (0–100)"
            placeholderTextColor={Theme.textMuted}
            keyboardType="number-pad"
            maxLength={3}
            value={ageText}
            onChangeText={setAgeText}
          />

          {/* Sex */}
          <Text style={styles.fieldLabel}>BIOLOGICAL SEX</Text>
          <View style={styles.sexRow}>
            {[
              { key: 'male', label: 'Male' },
              { key: 'female', label: 'Female' },
              { key: 'unknown', label: 'Prefer not to say' },
            ].map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.sexBtn, sex === item.key && styles.sexBtnActive]}
                onPress={() => setSex(item.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sexBtnText, sex === item.key && styles.sexBtnTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lesion location */}
          <Text style={styles.fieldLabel}>LESION LOCATION</Text>
          <View style={styles.locationGrid}>
            {LOCATIONS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.locationChip, location === item.key && styles.locationChipActive]}
                onPress={() => setLocation(location === item.key ? null : item.key)}
                activeOpacity={0.8}
              >
                <Text style={[styles.locationChipText, location === item.key && styles.locationChipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer actions */}
          <View style={styles.detailsFooter}>
            <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── ANALYZING phase ───────────────────────────────────────────────────────
  if (phase === PHASES.ANALYZING) {
    const steps = ['Processing image...', 'Running AI model...', 'Analyzing results...'];
    return (
      <View style={[styles.container, styles.centerContent]}>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.analyzeThumb} />}
        <ActivityIndicator size="large" color={Theme.accent} style={{ marginTop: 24, marginBottom: 16 }} />
        <Text style={styles.analyzeTitle}>{steps[scanStep]}</Text>
        <Text style={styles.analyzeDesc}>Screening across 7 lesion types</Text>
        <View style={styles.stepDots}>
          {[0, 1, 2].map((index) => (
            <View key={index} style={[styles.dot, scanStep >= index && styles.dotActive]} />
          ))}
        </View>
      </View>
    );
  }

  // ── RESULT phase ──────────────────────────────────────────────────────────
  if (phase === PHASES.RESULT && result) {

    // OOD gate — show rejection screen before any diagnosis rendering
    if (result.isOOD) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <View style={[styles.header, { paddingTop: insets.top + 8, position: 'absolute', top: 0, left: 0, right: 0 }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHitArea}>
              <Text style={styles.backBtn}>← Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.oodBadge}>
            <Text style={styles.oodBadgeText}>?</Text>
          </View>
          <Text style={styles.oodTitle}>Unable to analyse</Text>
          <Text style={styles.oodBody}>
            This image doesn't appear to be a close-up skin lesion. For accurate results, please photograph the lesion directly with good lighting, filling most of the frame.
          </Text>
          <TouchableOpacity style={styles.oodBtn} onPress={resetScan} activeOpacity={0.85}>
            <Text style={styles.oodBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Confidence floor — hide class name when model has no dominant signal.
    // Exception: always show the diagnosis when tier is Suspicious — hiding it
    // while the verdict card says "Suspicious" creates a contradictory screen.
    const DISPLAY_CONFIDENCE_FLOOR = 35; // percent; result.confidence is 0–100
    const belowFloor = result.confidence < DISPLAY_CONFIDENCE_FLOOR && result.tier !== TIER.SUSPICIOUS;
    const displayDiagnosis = belowFloor ? 'Uncertain scan' : result.diagnosis;
    const showLowConfidenceNote = belowFloor;

    const info = CLASS_INFO[result.diagnosis];
    const tierColor = TIER_COLORS[result.tier];
    const tierBgColor = TIER_BG_COLORS[result.tier];
    const tierBadge = TIER_BADGE_LABELS[result.tier];

    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: Theme.paddingH, paddingTop: insets.top + 8, paddingBottom: 40 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtnHitArea}>
          <Text style={styles.backBtn}>Done</Text>
        </TouchableOpacity>

        {imageUri && <Image source={{ uri: imageUri }} style={styles.resultImage} />}

        {/* Tier verdict card */}
        <View style={[styles.verdictCard, { backgroundColor: tierColor }]}>
          <View style={styles.verdictBadge}>
            <Text style={styles.verdictBadgeText}>{tierBadge}</Text>
          </View>
          <Text style={styles.verdictTitle}>{result.tierName}</Text>
          <Text style={styles.verdictDesc}>{TIER_MESSAGES[result.tier]}</Text>
        </View>

        {/* Diagnosis */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DIAGNOSIS</Text>
          <View style={styles.diagRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.diagName}>{displayDiagnosis}</Text>
              {!showLowConfidenceNote && (
                <Text style={[styles.diagRisk, { color: info?.color }]}>{info?.risk}</Text>
              )}
            </View>
            <View style={[styles.confBadge, { backgroundColor: tierBgColor }]}>
              <Text style={[styles.confText, { color: tierColor }]}>
                {showLowConfidenceNote ? '—' : `${result.confidence}%`}
              </Text>
            </View>
          </View>
          {showLowConfidenceNote ? (
            <View style={styles.lowConfNote}>
              <Text style={styles.lowConfNoteText}>
                The model could not identify this lesion with sufficient confidence. Please consult a dermatologist.
              </Text>
            </View>
          ) : (
            <Text style={styles.diagDesc}>{info?.description}</Text>
          )}
        </View>

        {/* Classification breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>CLASSIFICATION BREAKDOWN</Text>
          {result.allProbabilities.map((item) => (
            <View key={item.name} style={styles.probRow}>
              <View style={styles.probHeader}>
                <Text style={styles.probName}>{item.name}</Text>
                <Text style={[styles.probValue, item.isCancer && { color: Theme.suspicious }]}>
                  {(item.probability * 100).toFixed(1)}%
                </Text>
              </View>
              <View style={styles.probBarBg}>
                <View
                  style={[
                    styles.probBarFill,
                    { width: `${Math.max(item.probability * 100, 0.5)}%` },
                    { backgroundColor: item.isCancer ? Theme.suspicious : Theme.accent },
                  ]}
                />
              </View>
            </View>
          ))}

          <View style={styles.cancerProbRow}>
            <Text style={styles.cancerProbLabel}>Cancer Probability</Text>
            <Text style={[styles.cancerProbValue, { color: tierColor }]}>
              {result.cancerProbability}%
            </Text>
          </View>
        </View>

        {/* CTA — only for suspicious (red) tier */}
        {result.tier === TIER.SUSPICIOUS && (
          <View style={styles.ctaCard}>
            <View style={styles.ctaIcon}>
              <Text style={styles.ctaIconText}>MD</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ctaTitle}>Book a Dermatologist</Text>
              <Text style={styles.ctaDesc}>Professional evaluation recommended</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.newScanBtn} onPress={resetScan} activeOpacity={0.85}>
          <Text style={styles.newScanText}>Scan Another Lesion</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── ERROR phase ───────────────────────────────────────────────────────────
  if (phase === PHASES.ERROR) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <View style={[styles.header, { paddingTop: insets.top + 8, position: 'absolute', top: 0, left: 0, right: 0 }]}>
          <TouchableOpacity onPress={resetScan} style={styles.backBtnHitArea}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorBadge}>
          <Text style={styles.errorBadgeText}>!</Text>
        </View>
        <Text style={styles.errorTitle}>Scan Failed</Text>
        <Text style={styles.errorBody}>
          The model could not process this image. This is likely a technical issue, not the image itself.
        </Text>
        {scanError && (
          <View style={styles.errorDetail}>
            <Text style={styles.errorDetailText}>{scanError}</Text>
          </View>
        )}
        <TouchableOpacity style={styles.oodBtn} onPress={resetScan} activeOpacity={0.85}>
          <Text style={styles.oodBtnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.bg },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  header: { padding: Theme.paddingH },
  backBtn: { fontSize: 20, color: Theme.accent, fontWeight: '600' },
  backBtnHitArea: { padding: 12, marginLeft: -12 },

  // PICK
  pickContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  heroBadge: {
    width: 72, height: 72, borderRadius: 24,
    backgroundColor: Theme.bgCardLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: Theme.border,
  },
  heroBadgeText: { color: Theme.accent, fontSize: 16, fontWeight: '800' },
  pickTitle: { fontSize: 24, fontWeight: '800', color: Theme.text, marginBottom: 8 },
  pickDesc: { fontSize: 15, color: Theme.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 300 },
  cameraBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    backgroundColor: Theme.accent, borderRadius: 16, padding: 18, marginBottom: 12,
  },
  galleryBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center',
    backgroundColor: Theme.bgCard, borderRadius: 16, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: Theme.border,
  },
  actionIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  galleryIcon: { backgroundColor: Theme.bgCardLight },
  actionIconText: { color: Theme.text, fontSize: 11, fontWeight: '800' },
  btnTitle: { color: Theme.text, fontSize: 16, fontWeight: '700' },
  btnSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  galleryBtnTitle: { color: Theme.text },
  galleryBtnSubtitle: { color: Theme.textSecondary },
  tips: {
    width: '100%', padding: 18, backgroundColor: Theme.bgCard,
    borderRadius: 14, borderWidth: 1, borderColor: Theme.border, marginBottom: 12,
  },
  tipsTitle: { fontSize: 13, fontWeight: '700', color: Theme.textSecondary, marginBottom: 8 },
  tipItem: { fontSize: 13, color: Theme.textMuted, lineHeight: 22 },
  disclaimerNote: {
    width: '100%', padding: 14, backgroundColor: Theme.bgCardLight,
    borderRadius: 12, borderWidth: 1, borderColor: Theme.border,
  },
  disclaimerNoteText: { fontSize: 12, color: Theme.textSecondary, lineHeight: 18, textAlign: 'center' },

  // DETAILS
  detailsContent: { padding: Theme.paddingH, paddingBottom: 40 },
  detailsThumb: {
    width: 100, height: 100, borderRadius: 16,
    backgroundColor: Theme.bgCard, alignSelf: 'center', marginBottom: 20,
  },
  detailsTitle: { fontSize: 26, fontWeight: '800', color: Theme.text, marginBottom: 6 },
  detailsSubtitle: { fontSize: 14, color: Theme.textSecondary, lineHeight: 20, marginBottom: 28 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: Theme.textMuted, letterSpacing: 1.2, marginBottom: 10 },
  ageInput: {
    backgroundColor: Theme.bgCard, borderRadius: 14, padding: 16,
    fontSize: 16, color: Theme.text, borderWidth: 1, borderColor: Theme.border,
    marginBottom: 24,
  },
  sexRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  sexBtn: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: Theme.bgCard, borderWidth: 1, borderColor: Theme.border,
  },
  sexBtnActive: { backgroundColor: Theme.accent, borderColor: 'transparent' },
  sexBtnText: { fontSize: 14, fontWeight: '600', color: Theme.textSecondary },
  sexBtnTextActive: { color: Theme.text },
  locationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 32 },
  locationChip: {
    paddingVertical: 9, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: Theme.bgCard, borderWidth: 1, borderColor: Theme.border,
  },
  locationChipActive: { backgroundColor: Theme.bgCardLight, borderColor: Theme.accent },
  locationChipText: { fontSize: 14, color: Theme.textSecondary, fontWeight: '500' },
  locationChipTextActive: { color: Theme.accent, fontWeight: '600' },
  detailsFooter: { flexDirection: 'row', gap: 12 },
  skipBtn: {
    flex: 1, padding: 16, borderRadius: 16, alignItems: 'center',
    backgroundColor: Theme.bgCard, borderWidth: 1, borderColor: Theme.border,
  },
  skipBtnText: { color: Theme.textSecondary, fontSize: 16, fontWeight: '600' },
  continueBtn: { flex: 2, padding: 16, borderRadius: 16, alignItems: 'center', backgroundColor: Theme.accent },
  continueBtnText: { color: Theme.text, fontSize: 16, fontWeight: '700' },

  // ANALYZING
  analyzeThumb: { width: 120, height: 120, borderRadius: 20, backgroundColor: Theme.bgCard },
  analyzeTitle: { fontSize: 22, fontWeight: '700', color: Theme.text },
  analyzeDesc: { fontSize: 14, color: Theme.textSecondary, marginTop: 6 },
  stepDots: { flexDirection: 'row', gap: 8, marginTop: 20 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.bgCardLight },
  dotActive: { backgroundColor: Theme.accent },

  // RESULT
  resultImage: {
    width: '100%', height: 200, borderRadius: 20,
    marginTop: 16, marginBottom: 16, backgroundColor: Theme.bgCard,
  },
  verdictCard: { borderRadius: Theme.radiusLg, padding: 28, alignItems: 'center', marginBottom: 16, overflow: 'hidden' },
  verdictBadge: {
    width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, backgroundColor: 'rgba(255,255,255,0.18)',
  },
  verdictBadgeText: { fontSize: 16, fontWeight: '800', color: Theme.text },
  verdictTitle: { fontSize: 24, fontWeight: '800', color: Theme.text, marginBottom: 8 },
  verdictDesc: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  card: {
    backgroundColor: Theme.bgCard, borderRadius: Theme.radiusMd, padding: 20,
    marginBottom: 14, borderWidth: 1, borderColor: Theme.border,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: Theme.textMuted, letterSpacing: 1.2, marginBottom: 14 },
  diagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  diagName: { fontSize: 20, fontWeight: '700', color: Theme.text },
  diagRisk: { fontSize: 13, fontWeight: '600', marginTop: 3 },
  diagDesc: { fontSize: 14, color: Theme.textSecondary, lineHeight: 21 },
  confBadge: { width: 56, height: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  confText: { fontSize: 16, fontWeight: '800' },
  probRow: { marginBottom: 14 },
  probHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  probName: { fontSize: 13, color: Theme.text, fontWeight: '500' },
  probValue: { fontSize: 13, fontWeight: '700', color: Theme.textSecondary },
  probBarBg: { height: 5, backgroundColor: Theme.bgCardLight, borderRadius: 3, overflow: 'hidden' },
  probBarFill: { height: '100%', borderRadius: 3 },
  cancerProbRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: 12,
    padding: 12, backgroundColor: Theme.bgCardLight, borderRadius: 10,
  },
  cancerProbLabel: { fontSize: 13, color: Theme.textSecondary },
  cancerProbValue: { fontSize: 14, fontWeight: '700' },
  ctaCard: {
    flexDirection: 'row', alignItems: 'center', padding: 18,
    backgroundColor: Theme.suspiciousBg, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.2)', marginBottom: 14, gap: 14,
  },
  ctaIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Theme.suspicious, alignItems: 'center', justifyContent: 'center',
  },
  ctaIconText: { color: Theme.text, fontSize: 14, fontWeight: '800' },
  ctaTitle: { fontSize: 16, fontWeight: '700', color: Theme.text },
  ctaDesc: { fontSize: 12, color: Theme.textSecondary, marginTop: 2 },
  newScanBtn: { backgroundColor: Theme.accent, borderRadius: 16, padding: 16, alignItems: 'center' },

  // OOD rejection screen
  oodBadge: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Theme.bgCardLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: Theme.border,
  },
  oodBadgeText: { fontSize: 32, color: Theme.textSecondary, fontWeight: '800' },
  oodTitle: { fontSize: 24, fontWeight: '800', color: Theme.text, textAlign: 'center', marginBottom: 12 },
  oodBody: {
    fontSize: 15, color: Theme.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 40, maxWidth: 300,
  },
  oodBtn: { backgroundColor: Theme.accent, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40 },
  oodBtnText: { color: Theme.text, fontSize: 16, fontWeight: '700' },

  // Low-confidence diagnosis note
  lowConfNote: {
    backgroundColor: Theme.bgCardLight, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Theme.border, marginTop: 4,
  },
  lowConfNoteText: { fontSize: 13, color: Theme.textSecondary, lineHeight: 19 },
  newScanText: { color: Theme.text, fontSize: 16, fontWeight: '700' },

  // ERROR phase
  errorBadge: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Theme.suspiciousBg, alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
  },
  errorBadgeText: { fontSize: 36, color: Theme.suspicious, fontWeight: '800' },
  errorTitle: { fontSize: 24, fontWeight: '800', color: Theme.text, textAlign: 'center', marginBottom: 12 },
  errorBody: {
    fontSize: 15, color: Theme.textSecondary, textAlign: 'center',
    lineHeight: 22, marginBottom: 16, maxWidth: 300,
  },
  errorDetail: {
    backgroundColor: Theme.bgCard, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: Theme.border, marginBottom: 32, maxWidth: 300,
  },
  errorDetailText: { fontSize: 12, color: Theme.textMuted, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});
