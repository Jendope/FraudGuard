"""
llm_client.py - Concrete LLM client implementations.

Each class exposes the minimal interface::

    client.ask(prompt: str) -> str

Clients are instantiated by ``llm_factory.get_llm_client()``.  You should
not create them directly in application code.

Design notes
------------
* ``HFPipelineLLMClient`` is the generic fallback and works with any model
  that Hugging Face ``text-generation`` pipeline supports.
* ``DeepSeekLLMClient`` and ``GLM5LLMClient`` are thin sub-classes that set
  the correct default model ID.  Override ``_build_pipeline`` to apply any
  model-specific configuration.
* Device mapping defaults to CPU (``device=-1``) to keep the demo runnable
  on any machine; change to ``device=0`` or ``device_map="auto"`` for GPU.

TODO: replace placeholder model IDs with verified Hugging Face hub paths
once the models are publicly released.
"""

from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger(__name__)


class HFPipelineLLMClient:
    """
    Generic LLM client backed by a Hugging Face ``text-generation`` pipeline.

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
        """
        Send *prompt* to the model and return the generated text.

        Parameters
        ----------
        prompt:
            The full prompt string (includes OCR text and/or RAG context).

        Returns
        -------
        str — the model's reply.
        """
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


# ---------------------------------------------------------------------------
# Model-specific sub-classes
# ---------------------------------------------------------------------------

class DeepSeekLLMClient(HFPipelineLLMClient):
    """
    LLM client for DeepSeek models.

    TODO: update default model ID to the verified Hugging Face hub path,
    e.g. ``"deepseek-ai/deepseek-llm-7b-chat"``.
    """

    def __init__(self, model_name: str = "deepseek/deepseek-llm", **kwargs: Any):
        super().__init__(model_name=model_name, **kwargs)


class GLM5LLMClient(HFPipelineLLMClient):
    """
    LLM client for GLM-5 (ChatGLM family) models.

    TODO: update default model ID to the verified Hugging Face hub path,
    e.g. ``"THUDM/glm-4-9b-chat"``.
    """

    def __init__(self, model_name: str = "glm5/glm5-llm", **kwargs: Any):
        super().__init__(model_name=model_name, **kwargs)
