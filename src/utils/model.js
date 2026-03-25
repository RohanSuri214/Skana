/**
 * DermaScan Model Inference — v10
 *
 * Uses react-native-pytorch-core for on-device PyTorch Mobile inference.
 * Falls back to mock inference when the native module is unavailable
 * (e.g., in Expo Go or when the native build fails).
 *
 * v10 model takes TWO inputs:
 *   - image tensor:    [1, 3, 260, 260] float32
 *   - metadata tensor: [1, 21] float32
 *       [0]    age / 100  (0.5 if unknown)
 *       [1-3]  sex one-hot (male, female, unknown)
 *       [4-18] body location one-hot (15 locations)
 *       [19]   domain: dermoscopic
 *       [20]   domain: clinical  ← always 1.0 for phone camera
 *
 * Correct API for react-native-pytorch-core 0.2.x:
 *   - Model loading:    torch.jit._loadForMobile(filePath)
 *   - Image loading:    ImageUtil.fromFile(filePath)
 *   - Blob conversion:  media.toBlob(image)
 *   - Tensor creation:  torch.fromBlob(blob, [H, W, 3])
 *   - Metadata tensor:  torch.tensor([[...values]], { dtype: torch.float32 })
 *   - Transforms:       torchvision.transforms.resize / normalize
 *   - Inference:        model.forward(imageTensor, metaTensor)
 *   - Output data:      output.data()  (method, not property)
 */

import {
  MODEL_CONFIG,
  CLASS_NAMES,
  CANCER_INDICES,
  TIER,
  TIER_NAMES,
  softmax,
  applyThresholds,
  getTier,
} from './classInfo';

let model = null;
let isModelLoaded = false;
let useMock = false;

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
  console.log('PyTorch Core not available — using mock inference:', e.message);
  useMock = true;
}

export async function loadModel() {
  if (useMock) {
    console.log('Mock mode: skipping model load');
    isModelLoaded = true;
    return true;
  }

  try {
    const { Asset } = require('expo-asset');
    const asset = Asset.fromModule(require('../assets/model/skin_cancer_v10.ptl'));
    await asset.downloadAsync();

    const localUri = asset.localUri;
    const filePath = localUri.startsWith('file://') ? localUri.slice(7) : localUri;

    model = await torch.jit._loadForMobile(filePath);
    isModelLoaded = true;
    console.log('Model v10 loaded successfully from:', filePath);
    return true;
  } catch (error) {
    console.error('Failed to load model, falling back to mock mode:', error);
    useMock = true;
    isModelLoaded = true;
    return true;
  }
}

export function getModelStatus() {
  return { loaded: isModelLoaded, mock: useMock };
}

// Build the [1, 21] metadata float array from patient details.
// All values default to "unknown" if patientData is null or fields are missing.
function buildMetadataArray(patientData) {
  const meta = new Array(21).fill(0);

  // [0]: age normalized to [0, 1]
  const age = patientData?.age;
  meta[0] = age != null && age >= 0 && age <= 100 ? age / 100 : 0.5;

  // [1-3]: sex one-hot — male=index1, female=index2, unknown=index3
  const sexIdx = { male: 1, female: 2, unknown: 3 }[patientData?.sex ?? 'unknown'] ?? 3;
  meta[sexIdx] = 1.0;

  // [4-18]: body location one-hot (15 locations)
  const locationMap = {
    back: 0, 'lower extremity': 1, trunk: 2, 'upper extremity': 3,
    abdomen: 4, face: 5, chest: 6, foot: 7, neck: 8, scalp: 9,
    hand: 10, ear: 11, genital: 12, acral: 13, unknown: 14,
  };
  const locIndex = locationMap[patientData?.location ?? 'unknown'] ?? 14;
  meta[4 + locIndex] = 1.0;

  // [19-20]: domain — always clinical (index 20) for phone camera
  meta[20] = 1.0;

  return meta;
}

async function preprocessImage(imageUri) {
  const filePath = imageUri.startsWith('file://') ? imageUri.slice(7) : imageUri;
  const image = await ImageUtil.fromFile(filePath);
  const blob = media.toBlob(image);
  const h = image.getHeight();
  const w = image.getWidth();

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

export async function predict(imageUri, patientData = null) {
  if (!isModelLoaded) {
    throw new Error('Model not loaded');
  }

  if (useMock) {
    return mockPredict();
  }

  try {
    const imageTensor = await preprocessImage(imageUri);
    const metaValues = buildMetadataArray(patientData);
    const metaTensor = torch.tensor([metaValues], { dtype: torch.float32 });

    const output = await model.forward(imageTensor, metaTensor);
    const logits = Array.from(output.data());
    const probs = softmax(logits);
    return buildResult(probs);
  } catch (error) {
    console.error('Inference error:', error);
    return mockPredict();
  }
}

function buildResult(probs) {
  const predClass = applyThresholds(probs);
  const diagnosis = CLASS_NAMES[predClass];
  const confidence = Math.round(probs[predClass] * 100);
  const cancerProb = CANCER_INDICES.reduce((sum, index) => sum + probs[index], 0);

  const tier = getTier(cancerProb, predClass, probs);
  const tierName = TIER_NAMES[tier];

  const allProbs = CLASS_NAMES.map((name, index) => ({
    name,
    probability: probs[index],
    isCancer: CANCER_INDICES.includes(index),
  })).sort((a, b) => b.probability - a.probability);

  return {
    tier,
    tierName,
    isSuspicious: tier === TIER.SUSPICIOUS, // backward compat
    diagnosis,
    confidence,
    cancerProbability: Math.round(cancerProb * 100),
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
      resolve(buildResult(mockProbs));
    }, 2000);
  });
}
