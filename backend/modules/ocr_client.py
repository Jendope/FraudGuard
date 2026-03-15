"""
ocr_client.py - OCR client implementations.

Supported engines
-----------------
* :class:`GLMOCR`         — GLM-OCR via the BigModel REST API (layout_parsing).
* :class:`QwenVLOCRClient` — Qwen VL OCR via the DashScope OpenAI-compatible API.

The active engine is selected by ``ocr_factory.get_ocr_client()`` based on the
``OCR_MODEL`` environment variable.  Adding a new engine only requires
implementing this interface and registering it in ``ocr_factory.py``::

    def extract_text(self, image_bytes: bytes) -> dict:
        # Returns {"text": str, "raw": Any, "meta": dict}
"""

from __future__ import annotations

import base64
import logging
import os
from typing import Any

import requests

logger = logging.getLogger(__name__)

# Default BigModel layout-parsing endpoint.
BIGMODEL_OCR_URL = "https://open.bigmodel.cn/api/paas/v4/layout_parsing"


class GLMOCR:
    """
    OCR client for GLM-OCR via the BigModel REST API.

    Parameters
    ----------
    model_name:
        Model ID passed in the request payload. Defaults to ``"glm-ocr"``.
    api_key:
        BigModel API key.  Falls back to the ``BIGMODEL_API_KEY`` env var.

    Example
    -------
    >>> ocr = GLMOCR()
    >>> with open("scan.png", "rb") as f:
    ...     result = ocr.extract_text(f.read())
    >>> print(result["text"])
    """

    def __init__(self, model_name: str = "glm-ocr", api_key: str | None = None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("BIGMODEL_API_KEY", "")
        if not self.api_key:
            raise ValueError(
                "BIGMODEL_API_KEY is required for GLM-OCR. "
                "Set it in your .env file or pass api_key= to GLMOCR()."
            )
        self.url = BIGMODEL_OCR_URL
        logger.info("GLMOCR client ready (model=%s, url=%s)", self.model_name, self.url)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_text(self, image_bytes: bytes) -> dict:
        """
        Run OCR on raw image bytes.

        The bytes are base64-encoded and sent as a ``data:image/png;base64,…``
        data URI in the ``file`` field of the request payload.

        Parameters
        ----------
        image_bytes:
            Raw bytes of a PNG, JPEG, TIFF, or any image format.

        Returns
        -------
        dict with keys:

        * ``text``  (str)  — extracted text from the API response
        * ``raw``   (Any)  — full deserialized JSON response
        * ``meta``  (dict) — provenance info (model name, input size)
        """
        if not isinstance(image_bytes, (bytes, bytearray)):
            raise TypeError(f"image_bytes must be bytes, got {type(image_bytes)}")

        b64_data = base64.b64encode(image_bytes).decode("utf-8")
        file_data = f"data:image/png;base64,{b64_data}"

        raw_result = self._call_api(file_data)
        return {
            "text": self._parse_response(raw_result),
            "raw": raw_result,
            "meta": {
                "model": self.model_name,
                "input_bytes": len(image_bytes),
            },
        }

    def extract_text_from_url(self, image_url: str) -> dict:
        """
        Run OCR on a publicly accessible image URL.

        Parameters
        ----------
        image_url:
            Fully-qualified HTTPS URL to an image.

        Returns
        -------
        Same structure as :meth:`extract_text`.
        """
        raw_result = self._call_api(image_url)
        return {
            "text": self._parse_response(raw_result),
            "raw": raw_result,
            "meta": {"model": self.model_name, "input_bytes": 0},
        }

    # Convenience overload — accept a file path as well as raw bytes.
    def extract_text_from_path(self, image_path: str) -> dict:
        """
        Convenience wrapper that reads a file from disk and calls
        :meth:`extract_text`.
        """
        with open(image_path, "rb") as fh:
            return self.extract_text(fh.read())

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _call_api(self, file_value: str) -> Any:
        """POST to the layout_parsing endpoint and return the parsed JSON."""
        payload = {"model": self.model_name, "file": file_value}
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        logger.debug("Calling GLM-OCR API (model=%s)", self.model_name)
        try:
            resp = requests.post(self.url, json=payload, headers=headers, timeout=60)
            resp.raise_for_status()
        except requests.exceptions.RequestException as exc:
            logger.error("GLM-OCR API request failed: %s", exc)
            raise RuntimeError(f"GLM-OCR API error: {exc}") from exc
        return resp.json()

    def _parse_response(self, data: Any) -> str:
        """
        Normalize the BigModel ``layout_parsing`` JSON response to a plain
        string.

        The API can return different shapes depending on the model version;
        this method handles the most common ones gracefully.
        """
        if not isinstance(data, dict):
            return str(data)

        # OpenAI-style choices response (most common for newer models).
        choices = data.get("choices")
        if choices and isinstance(choices, list) and choices:
            msg = choices[0].get("message", {})
            content = msg.get("content", "")
            if isinstance(content, str):
                return content

        # Fallback: look for common top-level text fields.
        for key in ("content", "result", "text"):
            val = data.get(key)
            if isinstance(val, str):
                return val

        return str(data)


# ---------------------------------------------------------------------------
# Qwen VL OCR via DashScope compatible API  (primary)
# ---------------------------------------------------------------------------

class QwenVLOCRClient:
    """
    OCR client for Qwen VL models via the DashScope OpenAI-compatible API.

    Sends the image as a base64 data URI in a vision chat message and extracts
    the text content from the model's reply.

    Parameters
    ----------
    model_name:
        Qwen VL model slug, e.g. ``"qwen-vl-ocr-2025-11-20"``.
        Defaults to ``"qwen-vl-ocr-2025-11-20"``.
    api_key:
        DashScope API key.  Falls back to the ``DASHSCOPE_API_KEY`` env var.

    Example
    -------
    >>> ocr = QwenVLOCRClient()
    >>> with open("scan.png", "rb") as f:
    ...     result = ocr.extract_text(f.read())
    >>> print(result["text"])
    """

    _DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

    def __init__(self, model_name: str = "qwen-vl-ocr-2025-11-20", api_key: str | None = None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY", "")
        if not self.api_key:
            raise ValueError(
                "DASHSCOPE_API_KEY is required for QwenVLOCRClient. "
                "Set it in your .env file or pass api_key= to QwenVLOCRClient()."
            )
        logger.info("QwenVLOCRClient ready (model=%s)", self.model_name)

    def extract_text(self, image_bytes: bytes) -> dict:
        """
        Run OCR on raw image bytes using Qwen VL.

        Parameters
        ----------
        image_bytes:
            Raw bytes of a PNG, JPEG, TIFF, or any image format.

        Returns
        -------
        dict with keys:

        * ``text``  (str)  — extracted text from the model response
        * ``raw``   (Any)  — full API response object
        * ``meta``  (dict) — provenance info (model name, input size)
        """
        if not isinstance(image_bytes, (bytes, bytearray)):
            raise TypeError(f"image_bytes must be bytes, got {type(image_bytes)}")

        b64_data = base64.b64encode(image_bytes).decode("utf-8")
        data_uri = f"data:image/png;base64,{b64_data}"

        raw_result = self._call_api(data_uri)
        return {
            "text": self._parse_response(raw_result),
            "raw": raw_result,
            "meta": {
                "model": self.model_name,
                "input_bytes": len(image_bytes),
            },
        }

    def extract_text_from_url(self, image_url: str) -> dict:
        """
        Run OCR on a publicly accessible image URL.

        Parameters
        ----------
        image_url:
            Fully-qualified HTTPS URL to an image.

        Returns
        -------
        Same structure as :meth:`extract_text`.
        """
        raw_result = self._call_api(image_url, is_url=True)
        return {
            "text": self._parse_response(raw_result),
            "raw": raw_result,
            "meta": {"model": self.model_name, "input_bytes": 0},
        }

    def extract_text_from_path(self, image_path: str) -> dict:
        """Convenience wrapper that reads a file from disk and calls :meth:`extract_text`."""
        with open(image_path, "rb") as fh:
            return self.extract_text(fh.read())

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _call_api(self, image_value: str, is_url: bool = False) -> Any:
        """Call the DashScope vision API and return the parsed response object."""
        from openai import OpenAI  # lazy import for testability

        client = OpenAI(api_key=self.api_key, base_url=self._DASHSCOPE_BASE_URL)

        # Build the image content block
        if is_url:
            image_content: dict = {"type": "image_url", "image_url": {"url": image_value}}
        else:
            image_content = {"type": "image_url", "image_url": {"url": image_value}}

        logger.debug("Calling QwenVL OCR API (model=%s)", self.model_name)
        try:
            response = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            image_content,
                            {"type": "text", "text": "请提取图片中的所有文字内容，保持原始格式。"},
                        ],
                    }
                ],
            )
            return response
        except Exception as exc:
            logger.error("QwenVL OCR API request failed: %s", exc)
            raise RuntimeError(f"QwenVL OCR API error: {exc}") from exc

    def _parse_response(self, data: Any) -> str:
        """Extract the text content from the API response object."""
        # Handle OpenAI SDK response object
        if hasattr(data, "choices") and data.choices:
            content = data.choices[0].message.content
            return content if isinstance(content, str) else str(content)

        # Handle dict (e.g. deserialized JSON)
        if isinstance(data, dict):
            choices = data.get("choices")
            if choices and isinstance(choices, list) and choices:
                msg = choices[0].get("message", {})
                content = msg.get("content", "")
                if isinstance(content, str):
                    return content
            for key in ("content", "result", "text"):
                val = data.get(key)
                if isinstance(val, str):
                    return val

        return str(data)
