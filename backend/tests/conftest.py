"""
conftest.py - Shared pytest configuration for backend tests.

Sets up environment variables and patches module-level model loading so
that tests can import backend.app without downloading any weights.
"""

import os

# ---------------------------------------------------------------------------
# Ensure required env vars are present before any module-level code runs
# ---------------------------------------------------------------------------
os.environ.setdefault("DASHSCOPE_API_KEY", "test_key_for_tests")
os.environ.setdefault("BIGMODEL_API_KEY", "test_bigmodel_key_for_tests")
os.environ.setdefault("LLM_MODEL", "qwen3.5-plus")
os.environ.setdefault("OCR_MODEL", "glm-ocr")
os.environ.setdefault("DEFAULT_MODE", "raw")
