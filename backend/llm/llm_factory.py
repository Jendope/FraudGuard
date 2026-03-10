"""
llm_factory.py - Factory that returns an LLM client based on the LLM_MODEL
environment variable (or an explicit argument).

How to add a new model
----------------------
1.  Implement a class with the interface::

        class MyLLMClient:
            def ask(self, prompt: str) -> str: ...

2.  Register it in ``_REGISTRY`` with the model ID as key.

    _REGISTRY = {
        ...
        "my-org/my-model": MyLLMClient,
    }

3.  Set ``LLM_MODEL=my-org/my-model`` in your environment.

Example
-------
>>> from llm.llm_factory import get_llm_client
>>> client = get_llm_client()          # reads LLM_MODEL env var
>>> print(client.ask("Hello!"))
"""

from __future__ import annotations

import logging
import os
from typing import Any, Type

from .llm_client import DeepSeekLLMClient, GLM5LLMClient, HFPipelineLLMClient

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Registry: model-id -> client class
# ---------------------------------------------------------------------------
# TODO: add new models here — no other file needs to change.
_REGISTRY: dict[str, Type] = {
    "deepseek/deepseek-llm": DeepSeekLLMClient,
    "glm5/glm5-llm": GLM5LLMClient,
    # Generic fallback: any HF text-generation model
    "__hf_pipeline__": HFPipelineLLMClient,
}

# Cache of already-instantiated clients keyed by model name.
# Prevents loading the same model weights multiple times across calls.
_client_cache: dict[str, Any] = {}


def get_llm_client(model_name: str | None = None):
    """
    Return an LLM client instance for *model_name*.

    The client is cached after the first instantiation so that repeated
    calls with the same *model_name* reuse the existing instance instead
    of reloading model weights from disk.

    Parameters
    ----------
    model_name:
        Model ID string.  If ``None``, the value of the ``LLM_MODEL``
        environment variable is used (default ``"deepseek/deepseek-llm"``).

    Returns
    -------
    An object that implements ``ask(prompt: str) -> str``.

    Raises
    ------
    ValueError
        If the model ID is not found in the registry AND does not look like
        a Hugging Face hub path.
    """
    if model_name is None:
        model_name = os.getenv("LLM_MODEL", "deepseek/deepseek-llm")

    if model_name in _client_cache:
        logger.debug("Returning cached LLM client for model: %s", model_name)
        return _client_cache[model_name]

    logger.info("Resolving LLM client for model: %s", model_name)

    if model_name in _REGISTRY:
        client_cls = _REGISTRY[model_name]
        client = client_cls(model_name=model_name)
        _client_cache[model_name] = client
        return client

    # Fallback: treat any unknown string as a Hugging Face hub path and
    # attempt to load it with the generic HFPipelineLLMClient.
    if "/" in model_name:
        logger.warning(
            "Model '%s' not in registry — falling back to HFPipelineLLMClient.",
            model_name,
        )
        client = HFPipelineLLMClient(model_name=model_name)
        _client_cache[model_name] = client
        return client

    raise ValueError(
        f"Unknown LLM model '{model_name}'. "
        "Register it in backend/llm/llm_factory.py or provide a full "
        "Hugging Face hub path (e.g. 'org/model-name')."
    )
