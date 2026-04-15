"""
AI Food Classification Service
================================
Loads the .h5 Keras model once (lazy singleton) and classifies
food images as "edible" or "non-edible".

SETUP:
  Place your trained model file at:
    server/model/food_classifier.h5

  Adjust IMG_SIZE and CLASS_MAP below to match how your model was trained.
"""

import io
import os
import numpy as np
from PIL import Image

# ── CONFIG — adjust these to match your model ───────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "best_mobilenet_classifier.h5")
IMG_SIZE   = (224, 224)     # MobileNet standard input size
NORMALIZE  = True           # MobileNet expects pixels in [0, 1]

# Class mapping — IMPORTANT:
#   If your model outputs 1 neuron (sigmoid binary):
#     output >= 0.5  → CLASS_BINARY_POSITIVE below
#   If your model outputs 2 neurons (softmax):
#     argmax=0 → index 0 label, argmax=1 → index 1 label
CLASS_BINARY_POSITIVE = "non-edible"  # output >= 0.5 means non-edible
SOFTMAX_CLASSES       = ["edible", "non-edible"]

# ── Lazy singleton ───────────────────────────────────────────────
_model = None

def get_model():
    global _model
    if _model is None:
        try:
            import h5py, json, shutil, tempfile, os
            from tensorflow.keras.models import load_model as keras_load_model

            print("[AI] Patching & loading model ...")

            # ── Copy h5 to a temp file so we can patch the config in-place ─
            tmp = tempfile.NamedTemporaryFile(suffix=".h5", delete=False)
            tmp.close()
            shutil.copy2(MODEL_PATH, tmp.name)

            try:
                with h5py.File(tmp.name, "r+") as f:
                    if "model_config" in f.attrs:
                        cfg_str = f.attrs["model_config"]
                        cfg     = json.loads(cfg_str)

                        def strip_kwargs(obj):
                            """Recursively remove unsupported kwargs from all layer configs."""
                            if isinstance(obj, dict):
                                # Dense: remove quantization_config
                                if obj.get("class_name") == "Dense":
                                    obj.get("config", {}).pop("quantization_config", None)
                                # BatchNormalization: remove renorm args
                                if obj.get("class_name") == "BatchNormalization":
                                    for k in ("renorm", "renorm_clipping", "renorm_momentum", "renorm_momentum"):
                                        obj.get("config", {}).pop(k, None)
                                for v in obj.values():
                                    strip_kwargs(v)
                            elif isinstance(obj, list):
                                for item in obj:
                                    strip_kwargs(item)

                        strip_kwargs(cfg)
                        f.attrs["model_config"] = json.dumps(cfg)
                        print("[AI] Config patched (removed unsupported kwargs)")

                # Load the patched temp file
                _model = keras_load_model(tmp.name, compile=False)
                print("[AI] Model loaded OK  input={}  output={}".format(
                    _model.input_shape, _model.output_shape))
            finally:
                os.unlink(tmp.name)   # always delete temp file

        except ImportError:
            raise RuntimeError("TensorFlow/Keras not installed. Run: pip install tensorflow")
        except Exception as e:
            raise RuntimeError("Failed to load model: {}".format(e))
    return _model


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Read raw bytes -> PIL -> resize to 224x224 -> float32 [0,255].
    The model's own Rescaling layer (scale=1/127.5, offset=-1)
    converts [0,255] -> [-1,1] internally — do NOT normalize here.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(IMG_SIZE)
    arr = np.array(img, dtype=np.float32)   # raw pixels [0, 255]
    return np.expand_dims(arr, axis=0)      # shape (1, 224, 224, 3)




def classify_image(image_bytes: bytes) -> dict:
    """
    Run the .h5 model on the uploaded image bytes.

    Returns:
        {
          "label":      "edible" | "non-edible",
          "confidence": 0.0 – 1.0,
          "routed_to":  "NGO" | "Municipal"
        }
    """
    model = get_model()
    arr   = preprocess_image(image_bytes)
    pred  = model.predict(arr, verbose=0)   # shape: (1, 1) or (1, 2)

    if pred.shape[-1] == 1:
        # Binary sigmoid output — single neuron
        score = float(pred[0][0])
        if CLASS_BINARY_POSITIVE == "edible":
            label = "edible" if score >= 0.5 else "non-edible"
            confidence = score if label == "edible" else 1.0 - score
        else:
            label = "non-edible" if score >= 0.5 else "edible"
            confidence = score if label == "non-edible" else 1.0 - score
    else:
        # Multi-class softmax — take argmax
        idx   = int(np.argmax(pred[0]))
        label = SOFTMAX_CLASSES[idx] if idx < len(SOFTMAX_CLASSES) else "non-edible"
        confidence = float(pred[0][idx])

    routed_to = "NGO" if label == "edible" else "Municipal"

    print(f"[AI] Raw Prediction: {pred}")
    print("[AI] Classified: {} (confidence={:.1%}) -> {}".format(label, confidence, routed_to))
    return {
        "label":      label,
        "confidence": round(confidence, 4),
        "routed_to":  routed_to,
    }
