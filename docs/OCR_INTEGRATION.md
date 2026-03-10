# OCR Integration — GLM-OCR

## Overview

This document describes how the **GLM-OCR** model is integrated into the
pipeline and explains the key differences between OCR-specialised models and
multimodal reasoning models.

---

## Why OCR is Separated from Multimodal Reasoning

| Concern | OCR Model | Multimodal LLM |
|---|---|---|
| **Purpose** | Extract text faithfully | Reason over image + text jointly |
| **Output** | Clean, structured text | Natural-language response |
| **Replaceability** | Swap via `OCR_MODEL` env var | Swap via `LLM_MODEL` env var |
| **Latency** | Typically faster | Typically slower (larger model) |

Keeping OCR and LLM as separate steps means:

1. You can improve text extraction independently of reasoning quality.
2. The extracted text can be inspected and logged as a `provenance` field.
3. The same OCR output can be routed to different LLMs without re-running OCR.

---

## Exact `transformers.pipeline` Call

```python
from transformers import pipeline

OCR_PROMPT = (
    "Extract all textual content from the image. "
    "Return only the extracted text, preserving line breaks and ordering. "
    "Do not answer questions or perform reasoning."
)

pipe = pipeline(
    "image-text-to-text",
    model="zai-org/GLM-OCR",
    device=-1,                       # -1 = CPU; 0 = first CUDA GPU
    trust_remote_code=True,
)

# image_bytes: raw bytes of a PNG / JPEG image
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "data": image_bytes},
            {"type": "text", "text": OCR_PROMPT},
        ],
    }
]

result = pipe(text=messages)
# result is typically: [{"generated_text": "...extracted text..."}]
extracted_text = result[0]["generated_text"]
```

> **Note:** The exact call signature may vary slightly depending on the
> version of `transformers` and the model's `processor_config.json`.
> If the model requires `trust_remote_code=True`, add that argument to
> `pipeline(...)`.

---

## The OCR Prompt

```
Extract all textual content from the image.
Return only the extracted text, preserving line breaks and ordering.
Do not answer questions or perform reasoning.
```

**Why this prompt?**

- `"Return only the extracted text"` — prevents the model from generating
  hallucinated content or answering questions in the image.
- `"preserving line breaks and ordering"` — maintains document structure
  (tables, bullet lists) so downstream components can parse it.
- `"Do not answer questions or perform reasoning"` — keeps the OCR step
  purely extractive; all reasoning is delegated to the LLM step.

---

## GLM-OCR vs Multimodal LLMs

| | GLM-OCR | Multimodal LLM |
|---|---|---|
| **Model family** | Specialised OCR (image → text) | Large multimodal LLM |
| **Input** | Image only | Image + text (joint) |
| **Output style** | Faithful text extraction | Open-ended response |
| **Use case** | Document scanning, form digitisation | VQA, image captioning, reasoning |
| **Pipeline type** | `"image-text-to-text"` | `"image-text-to-text"` or chat API |

Use **GLM-OCR** when you need accurate text extraction.
Use a multimodal LLM when you want the model to
reason about the image content in conjunction with a user query.

---

## Replacing the OCR Model

Set the `OCR_MODEL` environment variable before starting the server:

```bash
OCR_MODEL=your-org/your-ocr-model python backend/app.py
```

The `GLMOCR` class in `backend/ocr/ocr_client.py` accepts `model_name`
as a constructor argument and passes it directly to `transformers.pipeline`.
No other code needs to change.
