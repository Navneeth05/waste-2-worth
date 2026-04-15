# AI Model Directory

Place your trained Keras model file here:

```
server/model/food_classifier.h5
```

## Configuration

Open `server/services/ai_model.py` and adjust these settings to match how your model was trained:

| Setting | Default | Description |
|---|---|---|
| `IMG_SIZE` | `(224, 224)` | Input image size your model expects |
| `NORMALIZE` | `True` | Whether to divide pixels by 255.0 |
| `CLASS_BINARY_POSITIVE` | `"edible"` | If binary sigmoid: what output >= 0.5 means |
| `SOFTMAX_CLASSES` | `["edible","non-edible"]` | If 2-class softmax: index 0 and index 1 labels |

## Output format

The model must output one of:
- **Binary sigmoid**: shape `(1, 1)` — single neuron, 0 to 1
- **2-class softmax**: shape `(1, 2)` — two probabilities summing to 1
