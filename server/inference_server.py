"""
Skana local inference server — dev-only, for iOS simulator.

Loads the skin_cancer_v11.ptl TorchScript model and exposes a single
POST /predict endpoint. The iOS simulator (running on this Mac) calls
http://127.0.0.1:8000/predict instead of the react-native-pytorch-core
native module, which cannot build for the arm64 simulator target.

v11 model returns a TUPLE: (probs [1,7], cancer_prob [1,1])
  - probs is already softmaxed and calibrated — do NOT apply softmax again
  - cancer_prob is the model's calibrated aggregate cancer probability

Usage:
  cd server
  uvicorn inference_server:app --host 127.0.0.1 --port 8000 --reload
"""

import io
import base64
import os
import torch
import torchvision.transforms as T
from PIL import Image
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "../src/assets/model/skin_cancer_v11.ptl",
)
IMG_SIZE = 260
NORM_MEAN = [0.485, 0.456, 0.406]
NORM_STD  = [0.229, 0.224, 0.225]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model = None


@app.on_event("startup")
def _load_model():
    global _model
    path = os.path.abspath(MODEL_PATH)
    if not os.path.exists(path):
        raise RuntimeError(f"Model not found at {path}")
    _model = torch.jit.load(path, map_location="cpu")
    _model.eval()
    print(f"[Skana] Model v11 loaded from {path}")


class PredictRequest(BaseModel):
    image_b64: str        # base64-encoded image (any format PIL can read)
    metadata: list[float] # 21 floats — see model.js buildMetadataArray


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/predict")
def predict(req: PredictRequest):
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # --- decode and preprocess image ---
    try:
        img_bytes = base64.b64decode(req.image_b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    transform = T.Compose([
        T.Resize((IMG_SIZE, IMG_SIZE)),
        T.ToTensor(),                          # [3, H, W], float32 in [0, 1]
        T.Normalize(mean=NORM_MEAN, std=NORM_STD),
    ])
    img_tensor = transform(img).unsqueeze(0)   # [1, 3, 260, 260]

    # --- metadata tensor ---
    if len(req.metadata) != 21:
        raise HTTPException(
            status_code=400,
            detail=f"metadata must have 21 values, got {len(req.metadata)}",
        )
    meta_tensor = torch.tensor([req.metadata], dtype=torch.float32)  # [1, 21]

    # --- run inference ---
    # v11 returns tuple: (probs [1,7], cancer_prob [1,1]) — already calibrated, no softmax
    with torch.no_grad():
        probs_tensor, cancer_prob_tensor = _model.forward(img_tensor, meta_tensor)

    probs = probs_tensor.squeeze().tolist()
    if isinstance(probs, float):  # edge case: single-class squeeze
        probs = [probs]
    cancer_prob = float(cancer_prob_tensor.squeeze())

    return {"probs": probs, "cancer_prob": cancer_prob}
