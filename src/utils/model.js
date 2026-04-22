/**
 * Skana Model Inference — v11
 *
 * Uses react-native-pytorch-core for on-device PyTorch Mobile inference.
 * Falls back to a local FastAPI server (dev/simulator), then mock.
 *
 * v11 model takes TWO inputs and returns a TUPLE:
 *   Input 1 — image tensor:    [1, 3, 260, 260] float32
 *   Input 2 — metadata tensor: [1, 21] float32
 *       [0]    age / 100  (0.5 if unknown)
 *       [1-3]  sex one-hot (male, female, unknown)
 *       [4-18] body location one-hot (15 locations)
 *       [19]   domain: dermoscopic
 *       [20]   domain: clinical  ← always 1.0 for phone camera
 *
 *   Output — tuple (probs [1,7], cancer_prob [1,1])
 *       probs       — already softmaxed + calibrated, do NOT apply softmax again
 *       cancer_prob — calibrated aggregate cancer probability from model head
 */

import {
  MODEL_CONFIG,
  CLASS_NAMES,
  CANCER_INDICES,
  TIER,
  TIER_NAMES,
  applyThresholds,
  getTier,
} from './classInfo';

let model = null;
let isModelLoaded = false;
let useMock = false;
let useLocalApi = false;

// Local inference server (dev only — iOS simulator cannot load the native
// PyTorch module because LibTorch-Lite has no arm64-simulator slice).
const LOCAL_API_URL = 'http://127.0.0.1:8000';

let torch = null;
let torchvision = null;
let ImageUtil = null;
let media = null;

try {
  const ptc = require('react-native-pytorch-core');
  torch = ptc.torch;
  torchvision = ptc.torchvision;
  ImageUtil = ptc.ImageUtil;
  media = ptc.media;
} catch (e) {
  console.log('PyTorch Core not available — will try local API server:', e.message);
  useLocalApi = true;
}

export async function loadModel() {
  if (useLocalApi) {
    try {
      const res = await fetch(`${LOCAL_API_URL}/health`);
      const body = await res.json();
      if (body.model_loaded) {
        isModelLoaded = true;
        console.log('Local inference server ready — real predictions enabled');
        return true;
      }
    } catch (_) {
      // server not running — fall through to mock
    }
    console.warn('Local inference server unreachable — falling back to mock. Start it with: cd server && uvicorn inference_server:app --host 127.0.0.1 --port 8000');
    useMock = true;
    isModelLoaded = true;
    return true;
  }

  if (useMock) {
    console.log('Mock mode: skipping model load');
    isModelLoaded = true;
    return true;
  }

  try {
    const { Asset } = require('expo-asset');
    const asset = Asset.fromModule(require('../assets/model/skin_cancer_v11.ptl'));
    await asset.downloadAsync();

    const localUri = asset.localUri;
    const filePath = localUri.startsWith('file://') ? localUri.slice(7) : localUri;

    model = await torch.jit._loadForMobile(filePath);
    isModelLoaded = true;
    console.log('Model v11 loaded successfully from:', filePath);
    return true;
  } catch (error) {
    console.error('Failed to load model, falling back to mock mode:', error);
    useMock = true;
    isModelLoaded = true;
    return true;
  }
}

export function getModelStatus() {
  return { loaded: isModelLoaded, mock: useMock, localApi: useLocalApi && !useMock };
}

// Build the [1, 21] metadata float array from patient details.
// All values default to "unknown" if patientData is null or fields are missing.
//
// Default (all-unknown) tensor:
//   [0.5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1]
//    ^         ^                                             ^     ^
//    age=0.5   sex=unknown (idx 3)          loc=unknown (idx 18)  clinical (idx 20)
function buildMetadataArray(patientData) {
  const meta = new Array(21).fill(0);

  // [0]: age normalized to [0, 1]
  const age = patientData?.age;
  meta[0] = age != null && age >= 0 && age <= 100 ? age / 100 : 0.5;

  // [1-3]: sex one-hot — male=slot[1], female=slot[2], unknown=slot[3]
  const sexIdx = { male: 1, female: 2, unknown: 3 }[patientData?.sex ?? 'unknown'] ?? 3;
  meta[sexIdx] = 1.0;

  // [4-18]: body location one-hot (15 locations), unknown=slot[18]
  const locationMap = {
    back: 0, 'lower extremity': 1, trunk: 2, 'upper extremity': 3,
    abdomen: 4, face: 5, chest: 6, foot: 7, neck: 8, scalp: 9,
    hand: 10, ear: 11, genital: 12, acral: 13, unknown: 14,
  };
  const locIndex = locationMap[patientData?.location ?? 'unknown'] ?? 14;
  meta[4 + locIndex] = 1.0;

  // [19-20]: domain — always clinical (slot[20]) for phone camera
  meta[20] = 1.0;

  return meta;
}

async function preprocessImage(imageUri) {
  const filePath = imageUri.startsWith('file://') ? imageUri.slice(7) : imageUri;
  const image = await ImageUtil.fromFile(filePath);
  const blob = media.toBlob(image);
  const h = image.getHeight();
  const w = image.getWidth();

  const expectedBytes = h * w * 3;
  if (blob.size !== expectedBytes) {
    image.release();
    throw new Error(
      `media.toBlob channel mismatch: got ${blob.size} bytes for ${h}×${w} image ` +
      `(expected ${expectedBytes} for RGB). Actual bytes/pixel: ${(blob.size / (h * w)).toFixed(1)}`
    );
  }

  const hwcTensor = torch.fromBlob(blob, [h, w, 3]);
  const chwTensor = hwcTensor.permute([2, 0, 1]);
  const floatTensor = chwTensor.to({ dtype: torch.float32 }).div(255.0);

  const resize = torchvision.transforms.resize([MODEL_CONFIG.imgSize, MODEL_CONFIG.imgSize]);
  const resizedTensor = resize(floatTensor);

  const normalize = torchvision.transforms.normalize(MODEL_CONFIG.normalizeMean, MODEL_CONFIG.normalizeStd);
  const normalizedTensor = normalize(resizedTensor);

  const inputTensor = normalizedTensor.unsqueeze(0);
  image.release();
  return inputTensor;
}

async function predictViaLocalApi(imageUri, patientData) {
  const FileSystem = require('expo-file-system');
  const uri = imageUri.startsWith('file://') ? imageUri : `file://${imageUri}`;
  const image_b64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

  const metadata = buildMetadataArray(patientData);

  const res = await fetch(`${LOCAL_API_URL}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_b64, metadata }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Server error ${res.status}: ${detail}`);
  }

  const { probs, cancer_prob } = await res.json();
  if (!Array.isArray(probs) || probs.length !== 7) {
    throw new Error('Invalid server response: expected probs array of length 7');
  }

  return buildResult(probs, cancer_prob);
}

export async function predict(imageUri, patientData = null) {
  if (!isModelLoaded) {
    throw new Error('Model not loaded');
  }

  if (useMock) {
    return mockPredict();
  }

  if (useLocalApi) {
    try {
      return await predictViaLocalApi(imageUri, patientData);
    } catch (error) {
      console.error('Local API inference error:', error);
      throw error;
    }
  }

  try {
    const imageTensor = await preprocessImage(imageUri);
    const metaValues = buildMetadataArray(patientData);
    const metaTensor = torch.tensor([metaValues], { dtype: torch.float32 });

    // v11 returns tuple: (probs [1,7], cancer_prob [1,1]) — already calibrated, no softmax
    const [probsTensor, cancerProbTensor] = await model.forward(imageTensor, metaTensor);
    const probs = Array.from(probsTensor.data());
    const cancerProb = Array.from(cancerProbTensor.data())[0];

    return buildResult(probs, cancerProb);
  } catch (error) {
    console.error('Inference error:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// OUT-OF-DISTRIBUTION (OOD) DETECTION
//
// The model's softmax always sums to 1.0 — even for a waterfall photo it will
// distribute probability across 7 classes and produce a confident-looking result.
// These guards detect when the model has no real signal and surface an
// "Unable to analyse" state rather than a misleading prediction.
// ─────────────────────────────────────────────────────────────────────────────

// Max entropy for a 7-class uniform distribution = ln(7) ≈ 1.9459
const MAX_ENTROPY = Math.log(7);

// Predictions with entropy above this fraction of MAX_ENTROPY are flagged OOD.
// 0.65 * 1.9459 ≈ 1.265. Genuine lesion predictions sit at 0.05–0.40; confused
// out-of-distribution images typically exceed 1.30.
const ENTROPY_OOD_FRACTION = 0.65;

// Genuine lesion predictions almost always put ≥40% on one class.
// Below this the model has no dominant signal regardless of entropy.
const MIN_TOP_CONFIDENCE = 0.4;

function computeEntropy(probs) {
  return -probs.reduce((sum, p) => sum + (p > 0.000000001 ? p * Math.log(p) : 0), 0);
}

function isOutOfDistribution(probs) {
  const entropy = computeEntropy(probs);
  const highEntropy = entropy > ENTROPY_OOD_FRACTION * MAX_ENTROPY;
  const lowConfidence = Math.max(...probs) < MIN_TOP_CONFIDENCE;
  return highEntropy || lowConfidence;
}

// cancerProb: calibrated value from model's cancer_prob head.
// Falls back to summing cancer class probs when not available (mock path).
function buildResult(probs, cancerProb = null) {
  const effectiveCancerProb = cancerProb ?? CANCER_INDICES.reduce((sum, i) => sum + probs[i], 0);

  const predClass = applyThresholds(probs);
  const diagnosis = CLASS_NAMES[predClass];
  const confidence = Math.round(probs[predClass] * 100);

  const tier = getTier(effectiveCancerProb);
  const tierName = TIER_NAMES[tier];

  const allProbs = CLASS_NAMES.map((name, index) => ({
    name,
    probability: probs[index],
    isCancer: CANCER_INDICES.includes(index),
  })).sort((a, b) => b.probability - a.probability);

  return {
    tier,
    tierName,
    isSuspicious: tier === TIER.SUSPICIOUS,
    isOOD: isOutOfDistribution(probs),
    diagnosis,
    confidence,
    cancerProbability: Math.round(effectiveCancerProb * 100),
    melanomaProbability: Math.round(probs[1] * 100),
    allProbabilities: allProbs,
  };
}

function mockPredict() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const roll = Math.random();
      let mockProbs;
      if (roll < 0.50) {
        // Likely benign
        mockProbs = [0.72, 0.04, 0.12, 0.05, 0.03, 0.02, 0.02];
      } else if (roll < 0.75) {
        // Uncertain
        mockProbs = [0.35, 0.18, 0.18, 0.12, 0.08, 0.05, 0.04];
      } else {
        // Suspicious
        mockProbs = [0.08, 0.52, 0.10, 0.14, 0.08, 0.04, 0.04];
      }
      // No cancer_prob from mock — buildResult will compute it from class probs
      resolve(buildResult(mockProbs));
    }, 2000);
  });
}
