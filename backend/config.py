"""
config.py - Centralized configuration for the OCR → LLM pipeline.

All configurable values are read from environment variables with sensible
defaults so the server can run without any .env file for quick demos.
"""

import os

# ---------------------------------------------------------------------------
# Mode toggle
# ---------------------------------------------------------------------------
# Default processing mode when the request does not specify one.
# Accepted values: "raw" | "rag"
DEFAULT_MODE: str = os.getenv("DEFAULT_MODE", "raw")

# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------
# Hugging Face model ID for GLM-OCR.
OCR_MODEL: str = os.getenv("OCR_MODEL", "zai-org/GLM-OCR")

# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------
# Hugging Face model ID (or provider/model slug) for the generative LLM.
# Supported out of the box: "deepseek/deepseek-llm", "glm5/glm5-llm"
# Add new entries in backend/llm/llm_factory.py.
LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek/deepseek-llm")

# ---------------------------------------------------------------------------
# RAG / Retriever
# ---------------------------------------------------------------------------
# Sentence-transformer model used to embed OCR chunks for similarity search.
EMBED_MODEL: str = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# Maximum number of passages returned by the retriever.
RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "3"))

# Approximate number of words per text chunk when the OCR output is long.
RAG_CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "200"))

# ---------------------------------------------------------------------------
# Whisper speech-to-text
# ---------------------------------------------------------------------------
# Whisper model size.  Accepted values: "tiny", "base", "small", "medium",
# "large".  Larger models are slower but more accurate.
WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "base")

# Optional ISO-639-1 language code to skip auto-detection (e.g. "en", "zh").
# Leave empty to let Whisper detect the language automatically.
WHISPER_LANGUAGE: str | None = os.getenv("WHISPER_LANGUAGE") or None

# Torch device for Whisper: "cpu" or "cuda".
WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "5000"))
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
