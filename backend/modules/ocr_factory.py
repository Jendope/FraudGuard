"""
ocr_factory.py - Factory that returns an OCR client based on the OCR_MODEL
environment variable (or an explicit argument).

How to add a new OCR engine
----------------------------
1.  Implement a class with the interface::

        class MyOCRClient:
            def extract_text(self, image_bytes: bytes) -> dict:
                # Returns {"text": str, "raw": Any, "meta": dict}
                ...

2.  Register it in ``_REGISTRY`` with the model ID prefix or exact key.

3.  Set ``OCR_MODEL=my-model-name`` in your environment.

Supported models
----------------
* ``qwen-vl-*``   — Qwen VL OCR via DashScope (default: ``qwen-vl-ocr-2025-11-20``)
* ``glm-ocr``     — GLM-OCR via BigModel REST API

Example
-------
>>> from modules.ocr_factory import get_ocr_client
>>> client = get_ocr_client()          # reads OCR_MODEL env var
>>> result = client.extract_text(open("scan.png", "rb").read())
>>> print(result["text"])
"""

from __future__ import annotations

import logging
import os
from typing import Any, Type

from .ocr_client import GLMOCR, QwenVLOCRClient

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Registry: model-id -> client class
# ---------------------------------------------------------------------------
# Exact-match entries.  Prefix-based routing is handled in get_ocr_client().
_REGISTRY: dict[str, Type] = {
    # Qwen VL OCR via DashScope (primary — default model)
    "qwen-vl-ocr-2025-11-20": QwenVLOCRClient,
    # GLM-OCR via BigModel (alternative)
    "glm-ocr": GLMOCR,
}

# Cache of already-instantiated clients keyed by model name.
_client_cache: dict[str, Any] = {}


def get_ocr_client(model_name: str | None = None):
    """
    Return an OCR client instance for *model_name*.

    The client is cached after the first instantiation so repeated calls
    with the same *model_name* reuse the existing instance.

    Parameters
    ----------
    model_name:
        Model ID string.  If ``None``, the value of the ``OCR_MODEL``
        environment variable is used (default ``"qwen-vl-ocr-2025-11-20"``).

    Returns
    -------
    An object that implements ``extract_text(image_bytes: bytes) -> dict``.

    Raises
    ------
    ValueError
        If the model ID is not found in the registry and no prefix match exists.
    """
    if model_name is None:
        model_name = os.getenv("OCR_MODEL", "qwen-vl-ocr-2025-11-20")

    if model_name in _client_cache:
        logger.debug("Returning cached OCR client for model: %s", model_name)
        return _client_cache[model_name]

    logger.info("Resolving OCR client for model: %s", model_name)

    # Exact match
    if model_name in _REGISTRY:
        client_cls = _REGISTRY[model_name]
        client = client_cls(model_name=model_name)
        _client_cache[model_name] = client
        return client

    # Prefix-based routing: "qwen-vl-*" → QwenVLOCRClient
    if model_name.startswith("qwen-vl"):
        logger.info("Routing '%s' to QwenVLOCRClient (prefix match).", model_name)
        client = QwenVLOCRClient(model_name=model_name)
        _client_cache[model_name] = client
        return client

    # Prefix-based routing: "glm-*" → GLMOCR
    if model_name.startswith("glm-"):
        logger.info("Routing '%s' to GLMOCR (prefix match).", model_name)
        client = GLMOCR(model_name=model_name)
        _client_cache[model_name] = client
        return client

    raise ValueError(
        f"Unknown OCR model '{model_name}'. "
        "Register it in backend/modules/ocr_factory.py or use a known prefix "
        "(e.g. 'qwen-vl-*' or 'glm-*')."
    )
