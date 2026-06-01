import Theme from './theme';

// ─────────────────────────────────────────────────────────────────────────────
// APP-SIDE INFERENCE GUARDRAILS
//
// MODEL_CONFIG.thresholds contains the raw optimal_thresholds from v15 training,
// tuned on a balanced dermoscopic test set with clean lesion crops.
//
// Two additional safety layers are applied at runtime via validateThresholds():
//
//   1. APP_THRESHOLD_FLOORS — per-class minimum values for real-world phone photos.
//      Training images were clean dermoscope crops; phone photos are noisier, lower
//      contrast, and often partially OOD. These floors prevent false cancer flags.
//      Applied FIRST, before the noise floor check.
//
//   2. SAFE_THRESHOLD_FLOOR (0.10) — any effective threshold still below this after
//      APP_THRESHOLD_FLOORS is at the statistical noise level and is disabled (null).
//      v15 raw thresholds are very low (0.03–0.07) but APP_THRESHOLD_FLOORS raise
//      all three well above 0.10, so none are disabled.
//
// These floors are app-side only. They do not affect the PTL model or training.
// ─────────────────────────────────────────────────────────────────────────────

export const MODEL_CONFIG = {
  imgSize: 260,
  numClasses: 7,
  normalizeMean: [0.485, 0.456, 0.406],
  normalizeStd: [0.229, 0.224, 0.225],
  // Raw optimal_thresholds from v15 training run — see guardrail comment above.
  thresholds: {
    melanoma: 0.07, // raw v15 value — raised to 0.35 by APP_THRESHOLD_FLOORS at runtime
    bcc: 0.03,      // raw v15 value — raised to 0.25 by APP_THRESHOLD_FLOORS at runtime
    actinic: 0.06,  // raw v15 value — raised to 0.15 by APP_THRESHOLD_FLOORS at runtime
  },
  tier: {
    benignThreshold: 0.20,
    suspiciousThreshold: 0.50,
  },
};

// Minimum safe threshold — below this a threshold fires on statistical noise alone.
const SAFE_THRESHOLD_FLOOR = 0.10;

// App-side per-class floors applied on top of raw training thresholds.
const APP_THRESHOLD_FLOORS = {
  melanoma: 0.35, // raw v15 0.07 — raised: phone photos reach higher MEL on noise alone
  bcc: 0.25,      // raw v15 0.03 — raised: reduces false BCC flags on ambiguous images
  actinic: 0.15,  // raw v15 0.06 — raised: now active (was null in v11/v12)
};

function validateThresholds(thresholds) {
  const warnings = [];
  const validated = {};
  Object.entries(thresholds).forEach(([cls, thresh]) => {
    // Apply APP_THRESHOLD_FLOORS first — v15 raw thresholds are very low (0.03–0.07)
    // and would all be nulled if the noise floor check ran first.
    const appFloor = APP_THRESHOLD_FLOORS[cls] ?? null;
    const effective = appFloor !== null ? Math.max(thresh, appFloor) : thresh;
    if (effective > thresh) {
      warnings.push(
        `"${cls}" threshold raised ${thresh} → ${effective} (app-side safety floor).`
      );
    }
    if (effective < SAFE_THRESHOLD_FLOOR) {
      warnings.push(
        `"${cls}" effective threshold ${effective} is below noise floor ${SAFE_THRESHOLD_FLOOR} — override disabled, argmax used.`
      );
      validated[cls] = null;
    } else {
      validated[cls] = effective;
    }
  });
  if (warnings.length > 0) {
    console.warn('[Skana] Threshold sanity check:', warnings);
  }
  return validated;
}

// Applied once at module load. Effective values: MEL=0.35, BCC=0.25, AK=0.15
const VALIDATED_THRESHOLDS = validateThresholds(MODEL_CONFIG.thresholds);

export const CANCER_INDICES = [1, 3, 4];
export const BENIGN_INDICES = [0, 2, 5, 6];

// Three-tier classification system
export const TIER = { BENIGN: 0, UNCERTAIN: 1, SUSPICIOUS: 2 };
export const TIER_NAMES = ['Likely Benign', 'Uncertain', 'Suspicious'];
export const TIER_COLORS = [Theme.benign, Theme.warning, Theme.suspicious];
export const TIER_BG_COLORS = [Theme.benignBg, Theme.warningBg, Theme.suspiciousBg];

export const CLASS_NAMES = [
  'Melanocytic nevi',
  'Melanoma',
  'Benign keratosis',
  'Basal cell carcinoma',
  'Actinic keratoses',
  'Vascular lesions',
  'Dermatofibroma',
];

export const CLASS_INFO = {
  'Melanocytic nevi': {
    risk: 'Benign',
    color: Theme.benign,
    description: 'Common moles formed by clusters of melanocytes. Usually harmless but should be monitored for changes in size, shape, or color over time.',
    watchFor: 'Monitor existing moles for changes. New moles appearing after age 30 should be examined by a dermatologist.',
  },
  Melanoma: {
    risk: 'Cancer',
    color: Theme.suspicious,
    description: 'The most dangerous form of skin cancer, originating in melanocytes. Early detection is critical - survival rates exceed 95% when caught early.',
    watchFor: 'Use the ABCDE rule: Asymmetry, Border irregularity, Color variation, Diameter larger than 6mm, Evolving shape or size.',
  },
  'Benign keratosis': {
    risk: 'Benign',
    color: Theme.benign,
    description: 'Non-cancerous skin growths including seborrheic keratosis and solar lentigo. Very common with aging and sun exposure.',
    watchFor: 'Waxy, stuck-on appearance. Brown, black, or tan colored. Common after age 40. Harmless but can be removed cosmetically.',
  },
  'Basal cell carcinoma': {
    risk: 'Cancer',
    color: Theme.warning,
    description: 'The most common form of skin cancer. Slow-growing and rarely metastasizes, but requires treatment to prevent local tissue damage.',
    watchFor: 'Look for pearly or waxy bumps, flat flesh-colored or brown scar-like lesions, or sores that bleed and do not fully heal.',
  },
  'Actinic keratoses': {
    risk: 'Pre-cancer',
    color: Theme.warning,
    description: 'Rough, scaly patches caused by years of sun damage. Considered pre-cancerous as they can develop into squamous cell carcinoma if untreated.',
    watchFor: 'Rough, scaly patches on sun-exposed areas like face, ears, and hands. May be easier to feel than see. Can be pink, red, or brown.',
  },
  'Vascular lesions': {
    risk: 'Benign',
    color: Theme.benign,
    description: 'Skin marks caused by blood vessel abnormalities, including cherry angiomas and hemangiomas. Almost always harmless.',
    watchFor: 'Red or purple spots caused by blood vessel clusters. Cherry angiomas are extremely common and increase with age.',
  },
  Dermatofibroma: {
    risk: 'Benign',
    color: Theme.benign,
    description: 'Small, firm, raised bumps beneath the skin surface. Completely harmless and typically require no treatment.',
    watchFor: 'Small firm bumps, often on legs. May dimple inward when pinched from the sides. Usually painless and stable over time.',
  },
};

export function isCancerClass(classIndex) {
  return CANCER_INDICES.includes(classIndex);
}

export function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((value) => Math.exp(value - max));
  const sum = exps.reduce((total, value) => total + value, 0);
  return exps.map((value) => value / sum);
}

export function applyThresholds(probs) {
  const fired = [];

  // MEL: flag as melanoma if model is ≥35% confident (app-safe floor, raw v15=0.07)
  if (VALIDATED_THRESHOLDS.melanoma !== null && probs[1] >= VALIDATED_THRESHOLDS.melanoma) fired.push(1);
  // BCC: flag as BCC if model is ≥25% confident (app-safe floor, raw v15=0.03)
  if (VALIDATED_THRESHOLDS.bcc !== null && probs[3] >= VALIDATED_THRESHOLDS.bcc) fired.push(3);
  // AK: flag as actinic keratoses if model is ≥15% confident (app-safe floor, raw v15=0.06)
  if (VALIDATED_THRESHOLDS.actinic !== null && probs[4] >= VALIDATED_THRESHOLDS.actinic) fired.push(4);

  // If multiple fire, pick the one with the highest probability per v11 spec
  if (fired.length > 0) {
    return fired.reduce((best, cls) => (probs[cls] > probs[best] ? cls : best), fired[0]);
  }

  return probs.indexOf(Math.max(...probs));
}

// Tier is derived purely from cancer_prob per v15 spec:
// >= 0.50 → Suspicious, >= 0.20 → Uncertain, < 0.20 → Likely Benign
export function getTier(cancerProb) {
  if (cancerProb >= MODEL_CONFIG.tier.suspiciousThreshold) return TIER.SUSPICIOUS;
  if (cancerProb >= MODEL_CONFIG.tier.benignThreshold) return TIER.UNCERTAIN;
  return TIER.BENIGN;
}
