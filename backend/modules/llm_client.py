"""
llm_client.py - Concrete LLM client implementations.

Each class exposes the minimal interface::

    client.ask(prompt: str) -> str

Clients are instantiated by ``llm_factory.get_llm_client()``.  You should
not create them directly in application code.

Design notes
------------
* ``QwenLLMClient`` — primary LLM using any Qwen model via the DashScope
  OpenAI-compatible API.  The model name is set via the ``LLM_MODEL`` env
  var so it can be rotated freely (free-tier quota management).
* ``GLM5LLMClient`` — alternative LLM using GLM-5 via the ZhipuAI SDK
  (``zai-sdk``).  Requires ``BIGMODEL_API_KEY``.
* ``DeepSeekLLMClient`` — DeepSeek models via DashScope compatible API.
* ``HFPipelineLLMClient`` — generic fallback for any Hugging Face
  text-generation model (kept for backward compatibility).
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Qwen LLM via DashScope compatible API  (primary)
# ---------------------------------------------------------------------------

class QwenLLMClient:
    """
    LLM client for Qwen models via the DashScope OpenAI-compatible API.

    The model name is intentionally not hardcoded — rotate freely via the
    ``LLM_MODEL`` environment variable as free-tier quotas require.

    Parameters
    ----------
    model_name:
        Any Qwen model slug supported by DashScope, e.g. ``"qwen-plus"``,
        ``"qwen-turbo"``, ``"qwen-max"``.  Defaults to ``"qwen-plus"``.
    api_key:
        DashScope API key.  Falls back to the ``DASHSCOPE_API_KEY`` env var.
    """

    def __init__(self, model_name: str = "qwen-plus", api_key: str | None = None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY", "")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY is required for QwenLLMClient")
        logger.info("QwenLLMClient ready (model=%s)", model_name)

    def ask(self, prompt: str) -> str:
        """Send *prompt* and return the model's reply."""
        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        from openai import OpenAI  # type: ignore  # lazy import for testability

        client = OpenAI(
            api_key=self.api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        )
        logger.debug("QwenLLMClient ask: %d chars (model=%s)", len(prompt), self.model_name)
        try:
            response = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are an anti-fraud expert. Respond only in the requested JSON format without any additional text."},
                    {"role": "user", "content": prompt},
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.error("QwenLLMClient call failed: %s", exc)
            raise RuntimeError(f"Qwen LLM error: {exc}") from exc


# ---------------------------------------------------------------------------
# GLM-5 via ZhipuAI SDK (alternative)
# ---------------------------------------------------------------------------

class GLM5LLMClient:
    """
    Alternative LLM client for GLM-5 via the ZhipuAI SDK (``zai-sdk``).

    Requires ``BIGMODEL_API_KEY`` (BigModel / ZhipuAI API key).

    Parameters
    ----------
    model_name:
        GLM model slug.  Defaults to ``"glm-5"``.
    api_key:
        BigModel API key.  Falls back to the ``BIGMODEL_API_KEY`` env var.
    """

    def __init__(self, model_name: str = "glm-5", api_key: str | None = None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("BIGMODEL_API_KEY", "")
        if not self.api_key:
            raise ValueError("BIGMODEL_API_KEY is required for GLM5LLMClient")
        logger.info("GLM5LLMClient ready (model=%s)", model_name)

    def ask(self, prompt: str) -> str:
        """Send *prompt* to GLM-5 and return the model's reply."""
        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        from zai import ZhipuAiClient  # type: ignore  # lazy import for testability

        client = ZhipuAiClient(api_key=self.api_key)
        logger.debug("GLM5LLMClient ask: %d chars (model=%s)", len(prompt), self.model_name)
        try:
            response = client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                thinking={"type": "enabled"},
                max_tokens=65536,
                temperature=1.0,
            )
            return str(response.choices[0].message.content or "")
        except Exception as exc:
            logger.error("GLM5LLMClient call failed: %s", exc)
            raise RuntimeError(f"GLM-5 LLM error: {exc}") from exc


# ---------------------------------------------------------------------------
# DeepSeek via DashScope compatible API
# ---------------------------------------------------------------------------

class DeepSeekLLMClient:
    """
    LLM client for DeepSeek models via the DashScope OpenAI-compatible API.

    Parameters
    ----------
    model_name:
        DeepSeek model slug, e.g. ``"deepseek-v3"``, ``"deepseek-r1"``.
        Defaults to ``"deepseek-v3"``.
    api_key:
        DashScope API key.  Falls back to the ``DASHSCOPE_API_KEY`` env var.
    """

    def __init__(self, model_name: str = "deepseek-v3", api_key: str | None = None):
        self.model_name = model_name
        self.api_key = api_key or os.getenv("DASHSCOPE_API_KEY", "")
        if not self.api_key:
            raise ValueError("DASHSCOPE_API_KEY is required for DeepSeekLLMClient")
        logger.info("DeepSeekLLMClient ready (model=%s)", model_name)

    def ask(self, prompt: str) -> str:
        """Send *prompt* to DeepSeek and return the model's reply."""
        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        from openai import OpenAI  # type: ignore  # lazy import for testability

        client = OpenAI(
            api_key=self.api_key,
            base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
        )
        logger.debug("DeepSeekLLMClient ask: %d chars (model=%s)", len(prompt), self.model_name)
        try:
            response = client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content or ""
        except Exception as exc:
            logger.error("DeepSeekLLMClient call failed: %s", exc)
            raise RuntimeError(f"DeepSeek LLM error: {exc}") from exc


# ---------------------------------------------------------------------------
# Generic Hugging Face pipeline fallback (kept for backward compatibility)
# ---------------------------------------------------------------------------

class HFPipelineLLMClient:
    """
    Generic LLM client backed by a Hugging Face ``text-generation`` pipeline.

    Kept for backward compatibility and local/offline testing.

    Parameters
    ----------
    model_name:
        Hugging Face hub model ID.
    max_new_tokens:
        Maximum tokens the model is allowed to generate.
    device:
        ``-1`` for CPU, ``0`` for the first CUDA GPU.
    """

    def __init__(
        self,
        model_name: str,
        max_new_tokens: int = 512,
        device: int = -1,
    ):
        from transformers import pipeline  # type: ignore  # lazy import for testability

        logger.info("Loading LLM pipeline: %s (device=%d)", model_name, device)
        self._pipe = pipeline(
            "text-generation",
            model=model_name,
            device=device,
            max_new_tokens=max_new_tokens,
        )
        self.model_name = model_name
        logger.info("LLM pipeline loaded: %s", model_name)

    def ask(self, prompt: str) -> str:
        """Send *prompt* to the model and return the generated text."""
        if not prompt or not prompt.strip():
            raise ValueError("prompt must be a non-empty string")

        logger.debug("LLM ask: %d chars", len(prompt))
        try:
            outputs = self._pipe(prompt)
        except Exception as exc:
            logger.error("LLM pipeline failed: %s", exc)
            raise RuntimeError(f"LLM pipeline error: {exc}") from exc

        # Normalise output: list-of-dicts is the standard pipeline response.
        if isinstance(outputs, list) and outputs:
            first = outputs[0]
            if isinstance(first, dict):
                generated = first.get("generated_text", "")
                # Many pipelines echo the prompt; strip it.
                if generated.startswith(prompt):
                    generated = generated[len(prompt):].strip()
                return generated
        return str(outputs)
