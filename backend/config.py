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
# API keys
# ---------------------------------------------------------------------------
# DashScope API key — required for Qwen LLM and Qwen VL OCR.
DASHSCOPE_API_KEY: str = os.getenv("DASHSCOPE_API_KEY", "")

# BigModel / ZhipuAI API key — required for GLM-OCR and GLM-5.
BIGMODEL_API_KEY: str = os.getenv("BIGMODEL_API_KEY", "")

# ---------------------------------------------------------------------------
# OCR
# ---------------------------------------------------------------------------
# OCR model name.  Swap the engine by changing this single value:
#   "qwen-vl-ocr-2025-11-20"  — Qwen VL OCR via DashScope (default)
#   "glm-ocr"                 — GLM-OCR via BigModel
OCR_MODEL: str = os.getenv("OCR_MODEL", "qwen-vl-ocr-2025-11-20")

# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------
# Model slug for the generative LLM.
# Change freely — we rotate Qwen free-tier models often.
# Examples: "qwen-plus", "qwen-turbo", "qwen-max" (DashScope)
#           "glm5/glm5-llm" (GLM-5 via BigModel)
LLM_MODEL: str = os.getenv("LLM_MODEL", "qwen3.5-plus")

# ---------------------------------------------------------------------------
# RAG / Retriever
# ---------------------------------------------------------------------------
# Sentence-transformer model used to embed OCR chunks for similarity search.
EMBED_MODEL: str = os.getenv("EMBED_MODEL", "BAAI/bge-large-zh-v1.5")

# Maximum number of passages returned by the retriever.
RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "3"))

# Approximate number of words per text chunk when the OCR output is long.
RAG_CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "200"))

# ---------------------------------------------------------------------------
# Server
# ---------------------------------------------------------------------------
HOST: str = os.getenv("HOST", "0.0.0.0")
PORT: int = int(os.getenv("PORT", "5000"))
DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
