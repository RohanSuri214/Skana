import Theme from './theme';

export const MODEL_CONFIG = {
  imgSize: 260,
  numClasses: 7,
  normalizeMean: [0.485, 0.456, 0.406],
  normalizeStd: [0.229, 0.224, 0.225],
  thresholds: {
    melanoma: 0.16,
    bcc: 0.15,
    actinic: 0.09,
  },
  tier: {
    benignThreshold: 0.20,
    suspiciousThreshold: 0.50,
  },
};

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
  let predClass = probs.indexOf(Math.max(...probs));
  const { melanoma, bcc, actinic } = MODEL_CONFIG.thresholds;

  if (probs[1] >= melanoma) {
    predClass = 1;
  } else if (BENIGN_INDICES.includes(predClass)) {
    if (probs[3] >= bcc) {
      predClass = 3;
    } else if (probs[4] >= actinic) {
      predClass = 4;
    }
  }

  return predClass;
}

// Assigns one of three tiers based on cancer probability and predicted class.
// RED:   cancerProb >= 0.50, or (cancer class predicted with >= 30% confidence)
// AMBER: cancerProb >= 0.20, or any cancer class predicted
// GREEN: cancerProb < 0.20 and no cancer class predicted
export function getTier(cancerProb, predClass, probs) {
  const isCancerPred = CANCER_INDICES.includes(predClass);
  const confidence = probs[predClass];

  if (cancerProb >= MODEL_CONFIG.tier.suspiciousThreshold || (isCancerPred && confidence >= 0.30)) {
    return TIER.SUSPICIOUS;
  }
  if (cancerProb >= MODEL_CONFIG.tier.benignThreshold || isCancerPred) {
    return TIER.UNCERTAIN;
  }
  return TIER.BENIGN;
}
