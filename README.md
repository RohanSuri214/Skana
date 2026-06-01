# Skana — AI Skin Lesion Screening

Skana is a React Native mobile app that performs on-device AI screening of skin lesions. A user photographs or uploads a lesion, optionally enters patient metadata (age, biological sex, body location), and receives an immediate three-tier result — **Likely Benign**, **Uncertain**, or **Suspicious** — along with per-class probability breakdowns. All inference runs directly on the device using a bundled PyTorch Mobile model. No image is ever uploaded to a server.

> **This is a research prototype. Not a medical device. All results must be confirmed by a qualified dermatologist.**

---

## Demo / Screenshots

<!-- Add screenshots here -->

Most useful screenshots to include:
- **Home screen** — summary stats and "Start New Scan" button
- **Scan screen (photo pick)** — camera / gallery selection and tips
- **Patient details screen** — age, sex, and body location entry
- **Result screen — Likely Benign** (teal verdict card)
- **Result screen — Uncertain** (amber verdict card with per-class breakdown)
- **Result screen — Suspicious** (coral/red verdict card with "See a Dermatologist" CTA)
- **History screen** — filterable list of past scans
- **Learn screen** — lesion reference cards

---

## Features

- **7-class skin lesion classification**: Melanocytic nevi, Melanoma, Benign keratosis, Basal cell carcinoma, Actinic keratoses, Vascular lesions, Dermatofibroma
- **Three-tier clinical safety system**: Likely Benign (teal), Uncertain (amber), Suspicious (coral/red)
- **Patient metadata integration**: age, biological sex, and body location factored into each prediction via a 21-dimensional metadata tensor
- **On-device inference via PyTorch Mobile** (`react-native-pytorch-core`) — no images uploaded to any server
- **Scan history** stored locally on-device using AsyncStorage
- **Entropy-based out-of-distribution (OOD) detection** — flags non-lesion photos rather than returning a misleading result
- **Temperature-calibrated confidence scores** (temperature=0.9427, applied inside the exported model)
- **Confidence floor guard** — suppresses the class name display when model confidence is below 35% (except when the tier is Suspicious)

---

## Tech Stack

| Mobile App | ML Model |
|---|---|
| React Native 0.81.5 | EfficientNet-B2 (7.7M parameters) |
| Expo SDK 54 | Patient metadata fusion branch (21→64→32) |
| React Navigation (bottom tabs + native stack) | Trained on 34,193 images across 7 datasets |
| PyTorch Mobile (`react-native-pytorch-core ^0.2.0`) | PyTorch Mobile export (`.ptl` format) |
| AsyncStorage (scan history) | Temperature calibration (T=0.9427) |
| Expo Camera / Image Picker | EfficientNet-B2 backbone pretrained on ImageNet |

---

## ML Model Details

### Architecture

- **Backbone**: EfficientNet-B2 (pretrained on ImageNet) + metadata MLP branch (21→64→32 dimensions)
- **Input 1**: 260×260 RGB image tensor `[1, 3, 260, 260]`, normalized with ImageNet mean/std
- **Input 2**: 21-dimensional patient metadata tensor `[1, 21]`

  ```
  [0]    age / 100  (default 0.5 if unknown)
  [1-3]  sex one-hot  (male, female, unknown)
  [4-18] body location one-hot  (15 locations, unknown=slot[18])
  [19]   domain: dermoscopic
  [20]   domain: clinical  ← always 1.0 for phone camera photos
  ```

- **Output**: tuple `(probs [1,7], cancer_prob [1,1])` — both already calibrated; do **not** apply softmax again
- **Temperature**: 0.9427 (baked into the exported `.ptl` model)

### Training Datasets — 34,193 total images

| Dataset | Images | Domain | Notes |
|---------|--------|--------|-------|
| HAM10000 | 6,817 (train) | Dermoscopic | Patient-level split; full metadata |
| ISIC 2019 | 14,885 | Dermoscopic | Deduplicated against HAM10000 |
| Derm7pt | 1,727 | Both | Clinical + dermoscopic; 247 held out for domain eval |
| Fitzpatrick17k | 1,843 | Clinical | Diverse skin tones |
| Dermnet | 2,317 | Clinical | BKL and vascular classes |
| Augmented AK+DF | 4,498 | Dermoscopic | Offline-generated: AK 1,453→3,000; DF 323→1,500 |
| PAD-UFES-20 | 2,106 | Clinical (smartphone) | Most deployment-relevant dataset |

### Test Set Performance — 2,024 held-out HAM10000 images

| Metric | Value |
|--------|-------|
| Balanced Accuracy | 0.815 |
| Macro F1 (argmax) | 0.796 |
| Binary Cancer AUC | 0.927 |
| Calibration (ECE) | 0.020 |
| **3-Tier Cancer Catch** | **95.9%** |

### Per-Class Performance

| Class | Type | Recall (argmax) | Recall (3-tier) | AUC |
|-------|------|-----------------|-----------------|-----|
| Melanocytic nevi | Benign | 0.924 | — | 0.950 |
| Melanoma | Cancer | 0.598 | 0.903 | 0.916 |
| Benign keratosis | Benign | 0.626 | — | 0.942 |
| Basal cell carcinoma | Cancer | 0.811 | 0.878 | 0.986 |
| Actinic keratoses | Cancer | 0.896 | 0.955 | 0.995 |
| Vascular lesions | Benign | 0.853 | — | 0.967 |
| Dermatofibroma | Benign | 1.000 | — | 1.000 |

### Three-Tier System

The app does not display raw per-class predictions as the primary result. Instead, the probabilities for the three cancer classes (Melanoma, Basal cell carcinoma, Actinic keratoses) are summed into a single **cancer probability**, which drives the tier:

| Cancer Probability | Tier | Color | Action |
|---|---|---|---|
| ≥ 0.50 | **Suspicious** | Coral/red | See a dermatologist promptly |
| 0.20 – 0.50 | **Uncertain** | Amber | Consider a dermatologist visit |
| < 0.20 | **Likely Benign** | Teal | Monitor; no urgency |

Per-class thresholds can also override the argmax prediction to bias toward cancer safety:
- Melanoma: ≥ 0.35 confidence → flag as MEL (raw training threshold 0.07, raised app-side)
- Basal cell carcinoma: ≥ 0.25 confidence → flag as BCC (raw 0.03, raised app-side)
- Actinic keratoses: ≥ 0.15 confidence → flag as AK (raw 0.06, raised app-side)

These app-side floors are documented in `src/utils/classInfo.js` and do not affect the `.ptl` model.

### Known Limitation — Domain Gap

There is a **24.3-point domain gap** between dermoscopic test performance (F1=0.796) and clinical phone-photo validation (F1=0.553). The model was trained predominantly on dermoscope images but receives phone camera photos in production. Real-world accuracy is closer to **F1≈0.55**. Closing this gap is the primary area for future improvement.

---

## Project Structure

```
.
├── App.js                        # App root: navigation, model loading splash
├── app.json                      # Expo config (name, permissions, plugins)
├── package.json                  # npm dependencies and scripts
├── index.js                      # Expo entry point
├── metro.config.js               # Metro bundler config
├── babel.config.js               # Babel config
├── react-native.config.js        # React Native CLI config
├── skincancer-v15.ipynb          # Training notebook (run on Kaggle)
│
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js         # Dashboard: stats, recent scans, start scan CTA
│   │   ├── ScanFlowScreen.js     # Multi-phase scan: pick → details → analyze → result
│   │   ├── HistoryScreen.js      # Filterable scan history (All/Suspicious/Uncertain/Benign)
│   │   └── LearnScreen.js        # Reference cards for all 7 lesion types
│   │
│   ├── utils/
│   │   ├── model.js              # Model loading, preprocessing, inference, OOD detection
│   │   ├── classInfo.js          # Class names, thresholds, tier logic, CLASS_INFO descriptions
│   │   ├── storage.js            # AsyncStorage scan history (add, get, clear)
│   │   └── theme.js              # Design tokens (colors, spacing, radii)
│   │
│   └── assets/
│       └── model/
│           ├── skin_cancer_v15.ptl    # PyTorch Mobile model (NOT in repo — see Setup)
│           └── model_metadata.json   # Model config, class map, thresholds, metrics
│
├── server/
│   └── inference_server.py       # Dev-only FastAPI server (iOS Simulator fallback)
│
├── android/                      # Native Android project (Expo prebuild output)
└── ios/                          # Native iOS project (Expo prebuild output)
```

---

## Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Expo CLI**: `npm install -g expo-cli`
- **iOS Simulator** (Mac only, requires Xcode 15+) **or** **Android Emulator** (requires Android Studio) **or** the **Expo Go** app on a physical device
- **Git**

For native builds with real on-device inference (physical device required for PyTorch Mobile):
- Xcode 15+ (iOS)
- Android Studio with NDK (Android)

---

## Installation and Setup

### Step 1 — Clone the repository

```bash
git clone https://github.com/RohanSuri214/Skana.git
cd Skana
```

### Step 2 — Install JavaScript dependencies

```bash
npm install
```

### Step 3 — Add the ML model file

The ML model (`skin_cancer_v15.ptl`, ~30 MB) is **not included** in this repository due to file size. You must obtain it separately and place it at:

```
src/assets/model/skin_cancer_v15.ptl
```

The model can be obtained by:
- Running the training notebook `skincancer-v15.ipynb` on Kaggle (see [Reproducing the ML Model](#reproducing-the-ml-model) below), or
- Contacting the author directly.

The app loads it at startup via Expo's asset system:

```js
// src/utils/model.js
const asset = Asset.fromModule(require('../assets/model/skin_cancer_v15.ptl'));
await asset.downloadAsync();
const model = await torch.jit._loadForMobile(asset.localUri);
```

The `.ptl` file is bundled into the app at build time and resolved from the device's local cache at runtime. **If the model file is missing**, the app falls back automatically — first to the local FastAPI development server (see Step 4), then to **Demo Mode** (mock random predictions shown with a warning banner).

### Step 4 — (Optional) Start the local inference server for iOS Simulator

The iOS Simulator cannot load the PyTorch Mobile native module because LibTorch-Lite has no `arm64-simulator` slice. For simulator development with real predictions, run the local server instead:

```bash
cd server
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn inference_server:app --host 127.0.0.1 --port 8000 --reload
```

The server loads `skin_cancer_v15.ptl` from `src/assets/model/` and exposes a `POST /predict` endpoint that the app calls automatically when the native PyTorch module is unavailable.

### Step 5 — Install CocoaPods (iOS native builds only)

```bash
cd ios && pod install && cd ..
```

### Step 6 — Start the development server

```bash
npx expo start
```

- Press **`i`** for iOS Simulator
- Press **`a`** for Android Emulator
- Scan the QR code with **Expo Go** for a physical device

For native builds with on-device inference:

```bash
npm run ios      # builds and runs on iOS device/simulator
npm run android  # builds and runs on Android device/emulator
```

---

## Running the App — Step by Step

At launch, the app displays a loading splash while the AI model initialises. A "Demo Mode" banner appears if the model file is missing.

1. **Home screen** — shows total scans, clear vs. flagged counts, and the three most recent results. Tap **Start New Scan** to begin.

2. **Scan flow — Photo selection** — choose **Take Photo** (camera) or **Choose from Gallery**. Tips for good images are shown: hold the camera 10–15 cm from the lesion, use natural lighting, centre the lesion, avoid shadows.

3. **Scan flow — Patient details** — optionally enter age (0–100), biological sex, and body location from a chip grid of 14 anatomical sites. Tap **Skip** to analyse with unknown metadata, or **Continue** to include it. Both paths are valid; metadata improves accuracy.

4. **Analysing** — a three-step progress indicator appears while the model runs on-device. This takes 1–3 seconds on a physical device.

5. **Result screen** — displays:
   - A colour-coded **tier verdict card** (teal / amber / coral) with an action recommendation
   - The **predicted class** and its per-class confidence percentage
   - A **Classification Breakdown** bar chart for all 7 classes
   - The aggregate **Cancer Probability** percentage
   - A "See a Dermatologist" prompt for Suspicious results
   - If the image does not appear to be a skin lesion (OOD detected), a rejection screen is shown and the scan is not saved to history
   - If confidence is below 35% (and the result is not Suspicious), the class name is suppressed to avoid misleading the user

6. **History screen** — lists all saved scans (OOD scans excluded) with filter chips: All, Suspicious, Uncertain, Benign. Tap **Clear** to delete all history.

7. **Learn screen** — tap any of the 7 lesion types to see a description, risk classification, and what to watch for. The ABCDE rule for melanoma is shown in the doctor advice panel.

---

## Reproducing the ML Model

The training notebook is `skincancer-v15.ipynb` in the repository root. It is designed to run on **Kaggle** with a GPU accelerator (T4 or P100 recommended).

### Required Kaggle Datasets

Add these seven datasets as inputs before running the notebook:

| Kaggle Slug | Dataset |
|---|---|
| `kmader/skin-cancer-mnist-ham10000` | HAM10000 |
| `salviohexia/isic-2019-skin-lesion-images-for-classification` | ISIC 2019 |
| `menakamohanakumar/derm7pt` | Derm7pt |
| `nazmusresan/fitzpatrick17k` | Fitzpatrick17k |
| `shubhamgoel27/dermnet` | Dermnet |
| `rohansuri214/dermascan-augmented` | Augmented AK+DF (see below) |
| `hirantheboss/pad-uefs-20` | PAD-UFES-20 |

### Augmentation Step (run first)

Run `dermascan_augmentation.ipynb` before the main training notebook. This notebook performs offline augmentation on the two minority classes (AK: 1,453→3,000 images; DF: 323→1,500 images) and uploads the result as the `rohansuri214/dermascan-augmented` Kaggle dataset.

### Two-Stage Training

1. **Stage 1 — Head training** (20 epochs): The EfficientNet-B2 backbone stays frozen. Only the classification head and metadata MLP are trained. A 2× domain boost is applied to PAD-UFES-20 (clinical) samples to reduce the dermoscope/phone domain gap.
2. **Stage 2 — Fine-tuning**: The `conv_head` layer is unlocked and fine-tuned at a lower learning rate for additional epochs.

Temperature calibration is performed post-training on a validation split and baked into the model before export.

### Export

After training, the notebook exports:
- `skin_cancer_v15.ptl` — TorchScript Lite model for PyTorch Mobile
- `v15_metadata.json` — model config, class map, thresholds, and evaluation metrics

Rename `v15_metadata.json` to `model_metadata.json` and place both files in `src/assets/model/`.

---

## ⚠️ Medical Disclaimer

**Skana is a research prototype developed as a student project. It is NOT a medical device and does NOT provide medical diagnoses.**

- All results must be confirmed by a qualified dermatologist
- Never use this app as a substitute for professional medical advice
- The 95.9% cancer catch rate is measured on a dermoscopic held-out test set; real-world performance on phone camera photos is substantially lower (F1≈0.55)
- If you are concerned about a skin lesion, consult a healthcare professional immediately

---

## Author

**Rohan Suri**  
Computer Engineering, The University of Texas at Dallas — May 2026  
[linkedin.com/in/rohansuri214](https://www.linkedin.com/in/rohansuri214/)