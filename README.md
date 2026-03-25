# DermaScan — AI Skin Lesion Screening App

A cross-platform mobile app that uses a deep learning model (EfficientNet-B2) to screen skin lesions across 7 classification types.

## Features

- **Camera & Gallery** — Take a photo or pick from your library
- **AI Screening** — EfficientNet-B2 model trained on 22,000+ dermoscopic images
- **7-Class Classification** — Melanoma, BCC, Actinic keratoses, Nevi, BKL, Vascular, Dermatofibroma
- **Per-Class Thresholds** — Optimized cancer detection with adjustable sensitivity
- **Scan History** — Track all past scans with results
- **Educational Content** — Learn about each skin lesion type
- **Dark Medical Theme** — Premium clinical aesthetic

## Quick Start

### 1. Install dependencies

```bash
cd DermaScan
npm install
```

### 2. Add your model file

Download `skin_cancer_v8.ptl` from your Kaggle notebook output and place it in:
```
DermaScan/src/assets/model/skin_cancer_v8.ptl
```

**Without the model file, the app runs in Demo Mode with simulated predictions.**

### 3. Run the app

**For development (Expo Go — no model inference, demo mode only):**
```bash
npx expo start
```

**For full functionality with PyTorch Mobile (requires native build):**
```bash
npx expo prebuild
npx expo run:ios      # iOS
npx expo run:android  # Android
```

## Project Structure

```
DermaScan/
├── App.js                          # Root: navigation + model loading
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js           # Dashboard with stats + recent scans
│   │   ├── ScanFlowScreen.js       # Camera/gallery → analyzing → results
│   │   ├── HistoryScreen.js        # Past scans with filters
│   │   └── LearnScreen.js          # Educational content on 7 classes
│   ├── utils/
│   │   ├── theme.js                # Dark medical color scheme
│   │   ├── classInfo.js            # Class names, thresholds, softmax
│   │   ├── model.js                # PyTorch Mobile inference + mock
│   │   └── storage.js              # AsyncStorage for scan history
│   └── assets/
│       └── model/
│           └── skin_cancer_v8.ptl  # YOUR MODEL FILE (download from Kaggle)
```

## Model Details

- **Architecture:** EfficientNet-B2 (9.1M parameters)
- **Input:** 260×260 RGB images
- **Output:** 7-class probabilities
- **Normalization:** ImageNet mean/std
- **Thresholds:** MEL=0.14, BCC=0.07, AK=0.06
- **Training data:** HAM10000 + ISIC 2019 (22,099 images)
- **Binary AUC:** 0.90
- **Clinical catch rate:** 95.9% (with thresholds)

## How Inference Works

1. User captures/uploads image
2. Image resized to 260×260 and normalized
3. EfficientNet-B2 outputs 7 logits
4. Softmax converts to probabilities
5. Per-class thresholds applied (melanoma priority)
6. Result displayed with screening verdict

## Important Disclaimer

This app is for **educational and screening purposes only**. It is NOT a medical device and does NOT provide medical diagnosis. Always consult a qualified dermatologist for proper evaluation of skin lesions.
