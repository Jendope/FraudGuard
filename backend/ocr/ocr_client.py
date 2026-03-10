"""
ocr_client.py - GLM-OCR integration via Hugging Face transformers.

The client wraps transformers.pipeline("image-text-to-text") and exposes a
single method:

    extract_text(image_bytes: bytes) -> {"text": str, "raw": Any, "meta": dict}

Design notes
------------
* OCR is deliberately separated from multimodal reasoning so that the text
  extraction step can be swapped independently of the LLM.
* The OCR prompt instructs the model to return ONLY extracted text so that
  downstream components receive clean input.
* Pass `device=-1` to use CPU; change to `device=0` for the first CUDA GPU.
"""

from __future__ import annotations

import io
import logging
from typing import Any

logger = logging.getLogger(__name__)

# Canonical OCR prompt — do NOT change the wording; it is referenced in docs.
OCR_PROMPT = (
    "Extract all textual content from the image. "
    "Return only the extracted text, preserving line breaks and ordering. "
    "Do not answer questions or perform reasoning."
)


def parse_pipeline_result_to_text(result: Any) -> str:
    """
    Normalize the raw pipeline output to a plain string.

    Hugging Face image-text-to-text pipelines can return:
    - A list of dicts with key ``generated_text``  (most common)
    - A single dict with key ``generated_text``
    - A bare string

    Any unrecognised shape is coerced to ``str(result)``.
    """
    if isinstance(result, list) and result:
        first = result[0]
        if isinstance(first, dict):
            return str(first.get("generated_text", first))
        return str(first)
    if isinstance(result, dict):
        return str(result.get("generated_text", result))
    return str(result)


class GLMOCR:
    """
    OCR client for the GLM-OCR model.

    Parameters
    ----------
    model_name:
        Hugging Face model ID.  Defaults to ``"zai-org/GLM-OCR"``.
    device:
        ``-1`` for CPU, ``0`` for the first CUDA GPU.

    Example
    -------
    >>> ocr = GLMOCR()
    >>> with open("scan.png", "rb") as f:
    ...     result = ocr.extract_text(f.read())
    >>> print(result["text"])
    """

    def __init__(self, model_name: str = "zai-org/GLM-OCR", device: int = -1):
        # Lazy import so tests can mock the pipeline without loading weights.
        from transformers import pipeline  # type: ignore

        logger.info("Loading GLM-OCR model: %s (device=%d)", model_name, device)
        self.pipe = pipeline("image-text-to-text", model=model_name, device=device, trust_remote_code=True)
        self.model_name = model_name
        logger.info("GLM-OCR model loaded successfully.")

    def extract_text(self, image_bytes: bytes) -> dict:
        """
        Run OCR on raw image bytes.

        Parameters
        ----------
        image_bytes:
            Raw bytes of a PNG, JPEG, TIFF, or any PIL-compatible image.

        Returns
        -------
        dict with keys:

        * ``text``  (str)  — normalized extracted text
        * ``raw``   (Any)  — unmodified pipeline output
        * ``meta``  (dict) — provenance info (model name, input size)
        """
        if not isinstance(image_bytes, (bytes, bytearray)):
            raise TypeError(f"image_bytes must be bytes, got {type(image_bytes)}")

        # Build the message payload expected by image-text-to-text models.
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "image", "data": image_bytes},
                    {"type": "text", "text": OCR_PROMPT},
                ],
            }
        ]

        logger.debug("Running OCR pipeline on %d bytes", len(image_bytes))
        try:
            raw_result = self.pipe(text=messages)
        except Exception as exc:
            logger.error("OCR pipeline failed: %s", exc)
            raise RuntimeError(f"OCR pipeline error: {exc}") from exc

        extracted_text = parse_pipeline_result_to_text(raw_result)

        return {
            "text": extracted_text,
            "raw": raw_result,
            "meta": {
                "model": self.model_name,
                "input_bytes": len(image_bytes),
            },
        }

    # ------------------------------------------------------------------
    # Convenience overload — accept a file path as well as raw bytes
    # ------------------------------------------------------------------
    def extract_text_from_path(self, image_path: str) -> dict:
        """
        Convenience wrapper that reads a file from disk and calls
        :meth:`extract_text`.
        """
        with open(image_path, "rb") as fh:
            image_bytes = fh.read()
        return self.extract_text(image_bytes)
